# backend/routes/flashcard_routes.py

from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_flashcards_client
from services.flashcard_service import generate_flashcards
from services.explain_service import explain_flashcard  # ✅ NEW

flashcard_bp = Blueprint("flashcard_bp", __name__)

@flashcard_bp.route("/generate_flashcards", methods=["POST"])
def generate_flashcards_route():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return error_response("No text provided", 400)

    client = initialize_flashcards_client()
    try:
        cards = generate_flashcards(client, text)
        return success_response(cards)
    except Exception as e:
        return error_response(str(e))

# ✅ NEW ROUTE
@flashcard_bp.route("/explain_flashcard", methods=["POST"])
def explain_flashcard_route():
    data = request.get_json()
    question = data.get("question", "")
    answer = data.get("answer", "")
    language = data.get("language", "english")
    
    if not question or not answer:
        return error_response("Question and answer are required", 400)
    
    client = initialize_flashcards_client()
    try:
        explanation = explain_flashcard(client, question, answer, language)
        return success_response(explanation)
    except Exception as e:
        return error_response(str(e))