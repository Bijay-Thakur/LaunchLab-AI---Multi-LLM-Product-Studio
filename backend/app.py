import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from routes.launchlab_routes import bp as launchlab_bp

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(launchlab_bp)

    @app.get("/")
    def root():
        return {"service": "LaunchLab AI", "see": "/api/health"}

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
