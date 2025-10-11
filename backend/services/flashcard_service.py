import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def generate_flashcards(client, text: str):
    messages = [
        {"role": "system", "content": "You are a teacher generating simple flashcards."},
        {"role": "user", "content": (
            "From the text below, make flashcards in JSON array format. "
            "Each flashcard should have fields 'question' and 'answer' "
            "(one simple sentence each). "
            "Use simple language. Return only valid JSON, no extra text. "
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
        return cards
    except (OpenAIError, json.JSONDecodeError) as e:
        return {"error": str(e)}

