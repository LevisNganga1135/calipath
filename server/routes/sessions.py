from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WorkoutSession, SetLog

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.route("", methods=["GET"])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()
    sessions = WorkoutSession.query.filter_by(user_id=user_id).order_by(WorkoutSession.date.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


@sessions_bp.route("/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    user_id = get_jwt_identity()
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if str(session.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to view this session"}), 403

    return jsonify(session.to_dict()), 200


@sessions_bp.route("", methods=["POST"])
@jwt_required()
def create_session():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    if not data.get("date"):
        return jsonify({"error": "date is required"}), 400

    session = WorkoutSession(
        name=data.get("name", "Workout"),
        date=data["date"],
        user_id=user_id,
    )
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201


@sessions_bp.route("/<int:session_id>/sets", methods=["POST"])
@jwt_required()
def add_set(session_id):
    user_id = get_jwt_identity()
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if str(session.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to modify this session"}), 403

    data = request.get_json() or {}
    if not data.get("exercise_id") or not data.get("exercise_name"):
        return jsonify({"error": "exercise_id and exercise_name are required"}), 400

    # Auto-increment set_number per exercise within this session
    existing_sets = [s for s in session.sets if s.exercise_id == data["exercise_id"]]
    next_set_number = len(existing_sets) + 1

    set_log = SetLog(
        exercise_id=data["exercise_id"],
        exercise_name=data["exercise_name"],
        set_number=next_set_number,
        weight_kg=data.get("weight_kg"),
        reps=data.get("reps"),
        session_id=session.id,
    )
    db.session.add(set_log)
    db.session.commit()

    return jsonify(set_log.to_dict()), 201


@sessions_bp.route("/sets/<int:set_id>", methods=["DELETE"])
@jwt_required()
def delete_set(set_id):
    user_id = get_jwt_identity()
    set_log = SetLog.query.get(set_id)

    if not set_log:
        return jsonify({"error": "Set not found"}), 404
    if str(set_log.session.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this set"}), 403

    db.session.delete(set_log)
    db.session.commit()
    return jsonify({"message": "Set deleted"}), 200


@sessions_bp.route("/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user_id = get_jwt_identity()
    session = WorkoutSession.query.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 404
    if str(session.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this session"}), 403

    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted"}), 200


@sessions_bp.route("/last-logged/<int:exercise_id>", methods=["GET"])
@jwt_required()
def get_last_logged(exercise_id):
    """Powers the 'last logged: X kg' recall hint — finds the most recent
    set for this exercise across all of the user's sessions."""
    user_id = get_jwt_identity()

    last_set = (
        SetLog.query
        .join(WorkoutSession)
        .filter(WorkoutSession.user_id == user_id, SetLog.exercise_id == exercise_id)
        .order_by(SetLog.id.desc())
        .first()
    )

    if not last_set:
        return jsonify(None), 200

    return jsonify(last_set.to_dict()), 200