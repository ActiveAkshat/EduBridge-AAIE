from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_openai_client
from services.flashcard_service import generate_flashcards

flashcard_bp = Blueprint("flashcard_bp", __name__)

@flashcard_bp.route("/generate_flashcards", methods=["POST"])
def generate_flashcards_route():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return error_response("No text provided", 400)

    client = initialize_openai_client()
    try:
        cards = generate_flashcards(client, text)
        return success_response(cards)
    except Exception as e:
        return error_response(str(e))

