from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Post, Like, Comment
import cloudinary.uploader

posts_bp = Blueprint("posts", __name__)


@posts_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def get_posts():
    # optional=True: the feed is viewable whether logged in or not, but
    # liked_by_me only resolves correctly when we know who's asking.
    current_user_id = get_jwt_identity()
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict(current_user_id) for p in posts]), 200


@posts_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_image():
    """Uploads a raw image file to Cloudinary and returns its URL.
    Called separately from post creation so the frontend can preview
    the uploaded image before submitting the caption."""
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"error": "No image selected"}), 400

    try:
        result = cloudinary.uploader.upload(image_file, folder="feel_the_burn_posts")
        return jsonify({"image_url": result["secure_url"]}), 201
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@posts_bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("image_url"):
        return jsonify({"error": "image_url is required"}), 400

    post = Post(
        image_url=data["image_url"],
        caption=data.get("caption"),
        user_id=user_id,
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post.to_dict(user_id)), 201


@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)

    if not post:
        return jsonify({"error": "Post not found"}), 404
    if str(post.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this post"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200


@posts_bp.route("/<int:post_id>/like", methods=["POST"])
@jwt_required()
def toggle_like(post_id):
    """Toggles a like: if the user already liked this post, un-like it;
    otherwise, like it. Keeps the frontend simple — one button, one endpoint."""
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)

    if not post:
        return jsonify({"error": "Post not found"}), 404

    existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()

    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({"liked": False, "like_count": len(post.likes)}), 200

    new_like = Like(user_id=user_id, post_id=post_id)
    db.session.add(new_like)
    db.session.commit()
    return jsonify({"liked": True, "like_count": len(post.likes)}), 200


@posts_bp.route("/<int:post_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)

    if not post:
        return jsonify({"error": "Post not found"}), 404

    data = request.get_json()
    if not data or not data.get("body"):
        return jsonify({"error": "body is required"}), 400

    comment = Comment(body=data["body"], user_id=user_id, post_id=post_id)
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201


@posts_bp.route("/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    return jsonify([c.to_dict() for c in post.comments]), 200


@posts_bp.route("/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(comment_id):
    user_id = get_jwt_identity()
    comment = Comment.query.get(comment_id)

    if not comment:
        return jsonify({"error": "Comment not found"}), 404
    if str(comment.user_id) != str(user_id):
        return jsonify({"error": "Not authorized to delete this comment"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
