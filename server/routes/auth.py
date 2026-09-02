from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
import cloudinary.uploader

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data or not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "name, email, and password are required"}), 400

    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify({"error": "An account with this email already exists"}), 400

    user = User(name=data["name"], email=data["email"])
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Incorrect email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    """Updates editable profile fields — currently just the display name.
    Email/password changes aren't handled here on purpose (they need extra
    verification steps this endpoint doesn't do)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    new_name = (data.get("name") or "").strip()

    if not new_name:
        return jsonify({"error": "name is required"}), 400

    user.name = new_name
    db.session.commit()

    return jsonify(user.to_dict()), 200


@auth_bp.route("/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """Uploads a profile photo to Cloudinary and saves its URL on the user.
    Mirrors the posts.py upload pattern, using a separate folder so avatars
    and post images don't mix."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "avatar" not in request.files:
        return jsonify({"error": "No avatar file provided"}), 400

    avatar_file = request.files["avatar"]
    if avatar_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        # Reusing the same public_id per user overwrites their previous
        # avatar in Cloudinary instead of accumulating a new image every time.
        result = cloudinary.uploader.upload(
            avatar_file,
            folder="feel_the_burn_avatars",
            public_id=f"user_{user.id}",
            overwrite=True,
        )
        user.avatar_url = result["secure_url"]
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500
