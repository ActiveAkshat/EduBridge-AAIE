from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
import anthropic
import json
import re
import os

quickcheck_bp = Blueprint("quickcheck_bp", __name__)

_anthropic_client = None

def get_client():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY")
        )
    return _anthropic_client


@quickcheck_bp.route("/quickcheck", methods=["POST"])
def generate_quick_check():
    data    = request.get_json()
    topic   = data.get("topic", "")
    content = data.get("content", "")

    if not content:
        return error_response("No content provided", 400)

    prompt = f"""You are a helpful teacher creating a quick comprehension check for students.

Topic: {topic}

Content the student just read:
{content}

Generate exactly 2 multiple choice questions to check if the student understood the key ideas from the content above.

Rules:
- Questions must be directly answerable from the content above
- Each question has exactly 4 options (A, B, C, D)
- Only one option is correct
- Keep questions simple and clear for weak students
- The explanation for the correct answer should be 1-2 sentences referencing the content

Respond ONLY with valid JSON, no markdown, no extra text:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this is correct, based on the content."
    }},
    {{
      "question": "Question text here?",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correct_index": 2,
      "explanation": "Brief explanation of why this is correct, based on the content."
    }}
  ]
}}"""

    try:
        message = get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = message.content[0].text.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"^```\s*",     "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$",     "", raw, flags=re.MULTILINE)

        parsed = json.loads(raw)
        return success_response(parsed)

    except json.JSONDecodeError as e:
        return error_response(f"Failed to parse MCQ response: {str(e)}", 500)
    except anthropic.APIConnectionError:
        return error_response("Could not connect to Anthropic API", 503)
    except anthropic.RateLimitError:
        return error_response("Rate limit reached, try again shortly", 429)
    except anthropic.APIStatusError as e:
        return error_response(f"Anthropic API error: {e.message}", e.status_code)
    except Exception as e:
        return error_response(str(e), 500)