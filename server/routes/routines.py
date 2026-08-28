from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Routine

routines_bp = Blueprint("routines", __name__)


@routines_bp.route("", methods=["GET"])
@jwt_required()
def get_routines():
    user_id = get_jwt_identity()
    routines = Routine.query.filter_by(user_id=user_id).all()
    return jsonify([r.to_dict() for r in routines]), 200


@routines_bp.route("", methods=["POST"])
@jwt_required()
def create_routine():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("exercise_id") or not data.get("exercise_name"):
        return jsonify({"error": "exercise_id and exercise_name are required"}), 400

    routine = Routine(
        exercise_id=data["exercise_id"],
        exercise_name=data["exercise_name"],
        category=data.get("category"),
        thumbnail=data.get("thumbnail"),
        user_id=user_id,
    )

    db.session.add(routine)
    db.session.commit()

    return jsonify(routine.to_dict()), 201


@routines_bp.route("/<int:routine_id>", methods=["PATCH"])
@jwt_required()
def update_routine(routine_id):
    user_id = get_jwt_identity()
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404

    # Ownership check — a user can only modify their own data
    if str(routine.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to modify this routine"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    for field in ("exercise_name", "category", "thumbnail"):
        if field in data:
            setattr(routine, field, data[field])

    db.session.commit()
    return jsonify(routine.to_dict()), 200


@routines_bp.route("/<int:routine_id>", methods=["DELETE"])
@jwt_required()
def delete_routine(routine_id):
    user_id = get_jwt_identity()
    routine = Routine.query.get(routine_id)

    if not routine:
        return jsonify({"error": "Routine not found"}), 404

    if str(routine.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this routine"}), 403

    db.session.delete(routine)
    db.session.commit()
    return jsonify({"message": "Routine deleted"}), 200 