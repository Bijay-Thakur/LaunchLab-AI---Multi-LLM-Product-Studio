import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load env from project root first (where the user's .env lives), then backend/.env if present
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
BACKEND_ENV = Path(__file__).resolve().parent / ".env"
if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV)
if BACKEND_ENV.exists():
    load_dotenv(BACKEND_ENV, override=False)

from routes.launchlab_routes import bp as launchlab_bp  # noqa: E402
from routes.image_routes import bp as image_bp  # noqa: E402
from routes.langgraph_routes import bp as langgraph_bp  # noqa: E402


def _allowed_origins() -> list[str]:
    """Restrict CORS to configured frontend URL(s).

    FRONTEND_URL accepts a single URL or a comma-separated list. In dev we add
    localhost defaults so the demo works without extra config.
    """
    raw = os.environ.get("FRONTEND_URL", "").strip()
    origins = [o.strip() for o in raw.split(",") if o.strip()] if raw else []
    if not origins:
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    return origins


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": _allowed_origins()}},
        supports_credentials=False,
    )
    app.register_blueprint(launchlab_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(langgraph_bp)

    @app.get("/")
    def root():
        return {"service": "LaunchLab AI", "see": "/api/health"}

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
