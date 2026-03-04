import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def generate_quiz(client, topic_title: str, simplified_text: str):
    """
    Generate a structured quiz from simplified textbook content.
    Returns a validated JSON quiz object.
    """

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert educational assessment designer and a strict JSON generator. "
                "Your only task is to generate a valid JSON quiz object."
            )
        },
        {
            "role": "user",
            "content": f"""
Create a student-friendly quiz based on the simplified topic below.

Topic: {topic_title}

Simplified Content:
---
{simplified_text}
---

Instructions:
1. Create 5 multiple-choice questions.
2. Each question must:
   - Be clear and concept-based
   - Have 4 options
   - Have exactly ONE correct answer
3. Avoid tricky wording.
4. Focus on understanding, not memorization.
5. Keep language simple.

Output Rules:
- Return ONLY valid JSON.
- No markdown.
- No commentary.
- No trailing commas.
- All keys must use double quotes.

JSON Format:
{{
  "topic": "Topic Name",
  "questions": [
    {{
      "id": 1,
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_index": 0,
      "explanation": "Short explanation of why this is correct."
    }}
  ]
}}

Critical Rules:
- correct_index must be an integer (0,1,2,3)
- correct_index must match the correct option position
- IDs must be integers (1,2,3…)
- Exactly 5 questions
- Each question must include: id, question, options, correct_index, explanation
"""
        }
    ]

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"}
        )

        quiz_data = json.loads(response.choices[0].message.content)

        # ---- VALIDATION ----
        if "questions" not in quiz_data:
            raise ValueError("Invalid quiz structure")

        if len(quiz_data["questions"]) != 5:
            raise ValueError("Quiz must contain exactly 5 questions")

        for i, q in enumerate(quiz_data["questions"], start=1):
            if not all(k in q for k in ["id", "question", "options", "correct_index", "explanation"]):
                raise ValueError(f"Missing fields in question {i}")

            if not isinstance(q["id"], int):
                q["id"] = i

            if len(q["options"]) != 4:
                raise ValueError(f"Question {i} must have 4 options")

            # Ensure correct_index is an integer between 0-3
            if not isinstance(q.get("correct_index"), int) or not (0 <= q["correct_index"] <= 3):
                raise ValueError(f"Question {i} has invalid correct_index")

        return quiz_data

    except (OpenAIError, json.JSONDecodeError, ValueError) as e:
        return {"error": str(e)}