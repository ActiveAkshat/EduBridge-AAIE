from utils.gemini_client import MODEL
from services.stylometry_service import stylometrize_text

def simplify_text(client, text: str):
    """Simplify NCERT textbook content using Gemini via OpenAI-compatible interface + stylometry formatting"""
    prompt = (
        "Rewrite the following NCERT textbook content in simplified language.\n\n"
        "Guidelines:\n"
        "- Keep the explanation accurate to the original meaning.\n"
        "- Use simple words and short sentences.\n"
        "- Explain ideas clearly and step by step.\n"
        "- Use everyday examples only where helpful.\n"
        "- Do NOT add greetings, questions, or conversational phrases.\n"
        "- Do NOT address the reader directly.\n"
        "- Do NOT add motivational or emotional language.\n"
        "- Write in a neutral, textbook-style explanatory tone.\n"
        "- Preserve the exact text inside *...* markers (do not rewrite those words).\n"
        "- Keep paragraph breaks where the topic changes.\n\n"
        f"Original text:\n{text}\n\n"
        "Simplified explanation:"
    )

    messages = [{"role": "user", "content": prompt}]

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages
        )

        simplified = (response.choices[0].message.content or "").strip()
        formatted = stylometrize_text(simplified)

        return formatted

    except Exception as e:
        return f"Error simplifying text: {str(e)}"