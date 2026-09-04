from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    avatar_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    routines = db.relationship("Routine", backref="user", cascade="all, delete-orphan")
    passkeys = db.relationship("Passkey", backref="user", cascade="all, delete-orphan")
    workout_logs = db.relationship("WorkoutLog", backref="user", cascade="all, delete-orphan")
    workout_sessions = db.relationship("WorkoutSession", backref="user", cascade="all, delete-orphan")
    posts = db.relationship("Post", backref="user", cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="user", cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="user", cascade="all, delete-orphan")
        # Self-referential many-to-many via the Follow association table.
    # Two separate relationships are needed (rather than one simple backref)
    # because "who I follow" and "who follows me" are different queries over
    # the same table — foreign_keys= disambiguates which column each side uses.
    following = db.relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        backref="follower",
        cascade="all, delete-orphan",
    )
    followers = db.relationship(
        "Follow",
        foreign_keys="Follow.followed_id",
        backref="followed",
        cascade="all, delete-orphan",
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar_url,
        }
    def to_public_dict(self, current_user_id=None):
        """Public-facing profile shape — includes follow counts and whether
        the requester (if any) already follows this person. Used for
        anything showing OTHER users (suggested athletes, profile lookups),
        as opposed to to_dict() which is for the logged-in user's own data."""
        return {
            "id": self.id,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "follower_count": len(self.followers),
            "following_count": len(self.following),
            "is_following_by_me": (
                any(f.follower_id == current_user_id for f in self.followers)
                if current_user_id else False
            ),
        }

class Passkey(db.Model):
    __tablename__ = "passkeys"

    id = db.Column(db.Integer, primary_key=True)
    credential_id = db.Column(db.String, unique=True, nullable=False)  # base64url-encoded
    public_key = db.Column(db.String, nullable=False)  # base64url-encoded
    sign_count = db.Column(db.Integer, nullable=False, default=0)
    device_name = db.Column(db.String, nullable=True)  # e.g. "Chrome on Windows"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "device_name": self.device_name,
            "created_at": self.created_at.isoformat(),
        }

class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # the person doing the following
    followed_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # the person being followed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # A user can only follow a given other user once
    __table_args__ = (db.UniqueConstraint("follower_id", "followed_id", name="unique_follower_followed"),)

class Routine(db.Model):
    __tablename__ = "routines"

    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, nullable=False)  # wger exercise id
    exercise_name = db.Column(db.String, nullable=False)
    category = db.Column(db.String)
    thumbnail = db.Column(db.String)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "exercise_id": self.exercise_id,
            "exercise_name": self.exercise_name,
            "category": self.category,
            "thumbnail": self.thumbnail,
        }


class WorkoutLog(db.Model):
    __tablename__ = "workout_logs"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String, nullable=False)  # ISO date string
    weight_kg = db.Column(db.Float, nullable=True)
    measurement_cm = db.Column(db.Float, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "weight_kg": self.weight_kg,
            "measurement_cm": self.measurement_cm,
        } 

class WorkoutSession(db.Model):
    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, default="Workout")  # e.g. "Push Day"
    date = db.Column(db.String, nullable=False)  # ISO date string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    sets = db.relationship("SetLog", backref="session", cascade="all, delete-orphan", order_by="SetLog.id")

    def to_dict(self, include_sets=True):
        data = {
            "id": self.id,
            "name": self.name,
            "date": self.date,
            "user_id": self.user_id,
        }
        if include_sets:
            data["sets"] = [s.to_dict() for s in self.sets]
        return data


class SetLog(db.Model):
    __tablename__ = "set_logs"

    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, nullable=False)  # wger exercise id
    exercise_name = db.Column(db.String, nullable=False)
    set_number = db.Column(db.Integer, nullable=False)
    weight_kg = db.Column(db.Float, nullable=True)
    reps = db.Column(db.Integer, nullable=True)
    session_id = db.Column(db.Integer, db.ForeignKey("workout_sessions.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "exercise_id": self.exercise_id,
            "exercise_name": self.exercise_name,
            "set_number": self.set_number,
            "weight_kg": self.weight_kg,
            "reps": self.reps,
        }

class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String, nullable=False)
    caption = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    likes = db.relationship("Like", backref="post", cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="post", cascade="all, delete-orphan", order_by="Comment.created_at")

    def to_dict(self, current_user_id=None):
        return {
            "id": self.id,
            "image_url": self.image_url,
            "caption": self.caption,
            "created_at": self.created_at.isoformat(),
            "user_id": self.user_id,
            "author_name": self.user.name,
            "author_avatar": self.user.avatar_url,
            "like_count": len(self.likes),
            "comment_count": len(self.comments),
            "liked_by_me": any(l.user_id == current_user_id for l in self.likes) if current_user_id else False,
        }


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)

    # A user can only like a given post once
    __table_args__ = (db.UniqueConstraint("user_id", "post_id", name="unique_user_post_like"),)


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "user_id": self.user_id,
            "author_name": self.user.name,
            "author_avatar": self.user.avatar_url,
        }
