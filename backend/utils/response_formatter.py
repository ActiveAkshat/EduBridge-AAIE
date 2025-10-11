from flask import jsonify

def success_response(data, message="Success"):
    return jsonify({"status": "success", "message": message, "data": data}), 200

def error_response(message="Something went wrong", code=500):
    return jsonify({"status": "error", "message": message}), code