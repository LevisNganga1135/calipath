from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from models import db, bcrypt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    CORS(app, origins=[
    "http://localhost:5173",
    "https://calipath-eta.vercel.app",
])

    from routes.auth import auth_bp
    from routes.routines import routines_bp
    from routes.workout_logs import logs_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(routines_bp, url_prefix="/api/routines")
    app.register_blueprint(logs_bp, url_prefix="/api/workout-logs")

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Resource not found"}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5555)