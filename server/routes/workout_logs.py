from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WorkoutLog

logs_bp = Blueprint("workout_logs", __name__)


@logs_bp.route("", methods=["GET"])
@jwt_required()
def get_logs():
    user_id = get_jwt_identity()
    logs = WorkoutLog.query.filter_by(user_id=user_id).order_by(WorkoutLog.date).all()
    return jsonify([log.to_dict() for log in logs]), 200


@logs_bp.route("", methods=["POST"])
@jwt_required()
def create_log():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("date"):
        return jsonify({"error": "date is required"}), 400

    if not data.get("weight_kg") and not data.get("measurement_cm"):
        return jsonify({"error": "at least one of weight_kg or measurement_cm is required"}), 400

    log = WorkoutLog(
        date=data["date"],
        weight_kg=data.get("weight_kg"),
        measurement_cm=data.get("measurement_cm"),
        user_id=user_id,
    )

    db.session.add(log)
    db.session.commit()

    return jsonify(log.to_dict()), 201


@logs_bp.route("/<int:log_id>", methods=["DELETE"])
@jwt_required()
def delete_log(log_id):
    user_id = get_jwt_identity()
    log = WorkoutLog.query.get(log_id)

    if not log:
        return jsonify({"error": "Log not found"}), 404

    if str(log.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this log"}), 403

    db.session.delete(log)
    db.session.commit()
    return jsonify({"message": "Log deleted"}), 200 