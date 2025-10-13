import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def generate_flashcards(client, text: str):
    messages = [
        {"role": "system", "content": "You are a teacher generating simple flashcards for students."},
        {"role": "user", "content": (
            "From the text below, create flashcards in JSON format. "
            "Return a JSON object with a 'flashcards' array. "
            "Each flashcard should have:\n"
            "- 'question': A clear question (one sentence)\n"
            "- 'answer': A concise answer (one-two sentences)\n"
            "- 'explanation' (optional): Additional context if needed\n\n"
            "Use simple, student-friendly language. "
            "Return ONLY valid JSON with no extra text.\n\n"
            f"Text:\n\n{text}"
        )}
    ]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"}
        )
        msg = resp.choices[0].message.content
        cards = json.loads(msg)
        
        # Ensure the response has the expected structure
        if 'flashcards' not in cards:
            # If the response is a direct array, wrap it
            if isinstance(cards, list):
                cards = {"flashcards": cards}
            # If the response has cards at root level
            elif isinstance(cards, dict):
                cards = {"flashcards": [cards]}
        
        return cards
    except (OpenAIError, json.JSONDecodeError) as e:
        return {"error": str(e)}