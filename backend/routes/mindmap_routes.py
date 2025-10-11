from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_openai_client
from services.mindmap_service import generate_mindmap_code

mindmap_bp = Blueprint("mindmap_bp", __name__)

@mindmap_bp.route("/generate_mindmap", methods=["POST"])
def generate_mindmap_route():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return error_response("No text provided", 400)

    client = initialize_openai_client()
    try:
        mindmap = generate_mindmap_code(client, text)
        return success_response(mindmap)
    except Exception as e:
        return error_response(str(e))

