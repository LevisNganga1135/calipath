"""
Passkey (WebAuthn) registration and login.

Uses the `webauthn` PyPI package. Since this app has no server-side session
store, the "challenge" each flow generates is carried between the begin/
complete steps as a signed, short-lived token (via itsdangerous, which ships
with Flask) rather than a session cookie — this keeps it working cleanly
across the cross-origin frontend/backend split (Vercel + Render) without
needing cookie SameSite/credentials configuration.

If you hit a TypeError about an unexpected keyword argument on any of the
webauthn.* calls below, it usually means the installed `webauthn` package
version expects slightly different argument names — paste the error back
and we'll adjust.
"""

import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import webauthn
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url, options_to_json
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
)

from models import db, User, Passkey

passkeys_bp = Blueprint("passkeys", __name__)

CHALLENGE_MAX_AGE = 300  # 5 minutes to complete a registration/login attempt


def _serializer():
    # Reuses JWT_SECRET_KEY to sign challenge tokens — no new secret needed.
    return URLSafeTimedSerializer(current_app.config["JWT_SECRET_KEY"], salt="webauthn-challenge")


def _sign_challenge(payload):
    return _serializer().dumps(payload)


def _read_challenge_token(token):
    """Returns the decoded payload, or None if invalid/expired."""
    try:
        return _serializer().loads(token, max_age=CHALLENGE_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


# ---------------------------------------------------------------- Register

@passkeys_bp.route("/register/begin", methods=["POST"])
@jwt_required()
def register_begin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    existing = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(pk.credential_id))
        for pk in user.passkeys
    ]

    options = webauthn.generate_registration_options(
        rp_id=current_app.config["WEBAUTHN_RP_ID"],
        rp_name=current_app.config["WEBAUTHN_RP_NAME"],
        user_id=str(user.id).encode(),
        user_name=user.email,
        user_display_name=user.name,
        exclude_credentials=existing,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )

    token = _sign_challenge({
        "challenge": bytes_to_base64url(options.challenge),
        "user_id": user.id,
    })

    return jsonify({"options": options_to_json(options), "token": token}), 200


@passkeys_bp.route("/register/complete", methods=["POST"])
@jwt_required()
def register_complete():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    token = data.get("token")
    credential = data.get("credential")
    device_name = data.get("device_name")

    payload = _read_challenge_token(token) if token else None
    if not payload or str(payload.get("user_id")) != str(user.id):
        return jsonify({"error": "Registration session expired — please try again"}), 400

    try:
        verification = webauthn.verify_registration_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(payload["challenge"]),
            expected_origin=current_app.config["WEBAUTHN_ORIGIN"],
            expected_rp_id=current_app.config["WEBAUTHN_RP_ID"],
        )
    except Exception as e:
        return jsonify({"error": f"Verification failed: {str(e)}"}), 400

    new_passkey = Passkey(
        credential_id=bytes_to_base64url(verification.credential_id),
        public_key=bytes_to_base64url(verification.credential_public_key),
        sign_count=verification.sign_count,
        device_name=device_name,
        user_id=user.id,
    )
    db.session.add(new_passkey)
    db.session.commit()

    return jsonify(new_passkey.to_dict()), 201


# ------------------------------------------------------------------ Login

@passkeys_bp.route("/login/begin", methods=["POST"])
def login_begin():
    # Usernameless/discoverable flow — no email needed, the browser's
    # passkey picker shows whichever passkeys it has for this site.
    options = webauthn.generate_authentication_options(
        rp_id=current_app.config["WEBAUTHN_RP_ID"],
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    token = _sign_challenge({"challenge": bytes_to_base64url(options.challenge)})

    return jsonify({"options": options_to_json(options), "token": token}), 200


@passkeys_bp.route("/login/complete", methods=["POST"])
def login_complete():
    data = request.get_json() or {}
    token = data.get("token")
    credential = data.get("credential")

    payload = _read_challenge_token(token) if token else None
    if not payload:
        return jsonify({"error": "Login session expired — please try again"}), 400

    credential_id = (credential or {}).get("id")
    passkey = Passkey.query.filter_by(credential_id=credential_id).first()
    if not passkey:
        return jsonify({"error": "Passkey not recognized"}), 404

    try:
        verification = webauthn.verify_authentication_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(payload["challenge"]),
            expected_origin=current_app.config["WEBAUTHN_ORIGIN"],
            expected_rp_id=current_app.config["WEBAUTHN_RP_ID"],
            credential_public_key=base64url_to_bytes(passkey.public_key),
            credential_current_sign_count=passkey.sign_count,
        )
    except Exception as e:
        return jsonify({"error": f"Verification failed: {str(e)}"}), 400

    passkey.sign_count = verification.new_sign_count
    db.session.commit()

    user = passkey.user
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"token": access_token, "user": user.to_dict()}), 200


# --------------------------------------------------------------- Manage

@passkeys_bp.route("", methods=["GET"])
@jwt_required()
def list_passkeys():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify([pk.to_dict() for pk in user.passkeys]), 200


@passkeys_bp.route("/<int:passkey_id>", methods=["DELETE"])
@jwt_required()
def delete_passkey(passkey_id):
    user_id = get_jwt_identity()
    passkey = Passkey.query.get(passkey_id)

    if not passkey:
        return jsonify({"error": "Passkey not found"}), 404
    if str(passkey.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this passkey"}), 403

    db.session.delete(passkey)
    db.session.commit()
    return jsonify({"message": "Passkey deleted"}), 200