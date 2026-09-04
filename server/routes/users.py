from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Follow
from models import db, User, Follow, Post


users_bp = Blueprint("users", __name__)


@users_bp.route("/suggested", methods=["GET"])
@jwt_required(optional=True)
def get_suggested_users():
    """Powers the RightRail 'Suggested Athletes' list. Excludes yourself and
    anyone you already follow when logged in; otherwise just returns the
    newest members. Limited to 5 — this is a lightweight suggestion list,
    not a full user directory/search."""
    current_user_id = get_jwt_identity()

    query = User.query
    if current_user_id:
        already_following_ids = [
            f.followed_id for f in Follow.query.filter_by(follower_id=current_user_id).all()
        ]
        exclude_ids = already_following_ids + [int(current_user_id)]
        query = query.filter(User.id.notin_(exclude_ids))

    users = query.order_by(User.created_at.desc()).limit(5).all()
    return jsonify([u.to_public_dict(current_user_id) for u in users]), 200


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required(optional=True)
def get_user(user_id):
    """Public profile lookup — used anywhere we show someone else's card
    (e.g. clicking into a post author, or a suggested athlete)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_public_dict(current_user_id)), 200

@users_bp.route("/<int:user_id>/posts", methods=["GET"])
@jwt_required(optional=True)
def get_user_posts(user_id):
    """Powers the IG-style profile grid — every post by this specific user,
    newest first. Reuses Post.to_dict() exactly as the main feed does, so
    like/comment counts and liked_by_me stay correct on this view too."""
    current_user_id = get_jwt_identity()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict(current_user_id) for p in posts]), 200


@users_bp.route("/<int:user_id>/follow", methods=["POST"])
@jwt_required()
def toggle_follow(user_id):
    """Toggles a follow: if I already follow this user, unfollow; otherwise,
    follow. Same one-button toggle pattern as posts.py's like endpoint."""
    current_user_id = get_jwt_identity()

    if str(user_id) == str(current_user_id):
        return jsonify({"error": "You can't follow yourself"}), 400

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    existing_follow = Follow.query.filter_by(
        follower_id=current_user_id, followed_id=user_id
    ).first()

    if existing_follow:
        db.session.delete(existing_follow)
        db.session.commit()
        return jsonify({
            "following": False,
            "follower_count": len(target_user.followers),
        }), 200

    new_follow = Follow(follower_id=current_user_id, followed_id=user_id)
    db.session.add(new_follow)
    db.session.commit()
    return jsonify({
        "following": True,
        "follower_count": len(target_user.followers),
    }), 200