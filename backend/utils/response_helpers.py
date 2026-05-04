from flask import jsonify


def ok(data, status: int = 200):
    return jsonify({"ok": True, "data": data}), status


def error(message: str, status: int = 400):
    return jsonify({"ok": False, "error": message}), status
