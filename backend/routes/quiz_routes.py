from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_openai_client
from services.quiz_service import generate_quiz

quiz_bp = Blueprint("quiz_bp", __name__)

@quiz_bp.route("/generate_quiz", methods=["POST"])
def generate_quiz_route():
    data = request.get_json()
    topic_title = data.get("topic_title") or data.get("topic", "")
    simplified_text = data.get("simplified_text") or data.get("text", "")
    
    if not topic_title or not simplified_text:
        return error_response("Topic title and simplified text are required", 400)

    try:
        client = initialize_openai_client()
        quiz = generate_quiz(client, topic_title, simplified_text)
        return success_response(quiz, "Quiz generated successfully")
    except Exception as e:
        return error_response(str(e))