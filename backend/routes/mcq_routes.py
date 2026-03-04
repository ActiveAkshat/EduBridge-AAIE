from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_mcq_client, MODEL
import json
import re

mcq_bp = Blueprint("mcq_bp", __name__)

@mcq_bp.route("/mcq", methods=["POST"])
def generate_mcq():
    data    = request.get_json() or {}
    topic   = data.get("topic", "")
    content = data.get("content", "")

    if not content:
        return error_response("No content provided", 400)

    if len(content) > 3000:
        content = content[:3000]

    prompt = f"""You are a friendly, conversational AI tutor helping a student check their understanding.

Topic: {topic}

Content the student just read:
{content}

Generate exactly 2 multiple choice questions based ONLY on the content above.

Rules:
- Questions must be directly and clearly answerable from the content
- Each question has exactly 4 options labeled A, B, C, D
- Only one option is correct
- Keep language simple and friendly for weak students
- Write a warm, encouraging explanation (2-3 sentences) for the correct answer that references the content
- Write a gentle hint (1 sentence) for wrong answers that nudges the student without giving away the answer

Respond ONLY with valid JSON, no markdown:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correct_index": 0,
      "explanation": "Great job! This is correct because... [reference content here]",
      "hint": "Think about what the content says about [topic area]..."
    }},
    {{
      "question": "Question text here?",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correct_index": 2,
      "explanation": "Excellent! You got it! The content explains that... [reference content here]",
      "hint": "Re-read the part about [topic area] and try again!"
    }}
  ]
}}"""

    try:
        client = initialize_mcq_client()
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a warm, encouraging AI tutor. Respond only with valid JSON."},
                {"role": "user",   "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"```json", "", raw)
        raw = re.sub(r"```",     "", raw)
        raw = raw.strip()

        parsed = json.loads(raw)

        if "questions" not in parsed or not isinstance(parsed["questions"], list):
            return error_response("Invalid response structure from model", 500)

        return success_response(parsed)

    except json.JSONDecodeError as e:
        return error_response(f"Failed to parse response: {str(e)}", 500)
    except Exception as e:
        return error_response(str(e), 500)