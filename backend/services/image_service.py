import json
import requests
import os
from openai import OpenAIError
from utils.gemini_client import MODEL

RUNWARE_API_KEY = os.getenv("RUNWARE_API_KEY")
RUNWARE_URL = "https://api.runware.ai/v1"

def generate_image_prompts(client, simplified_text: str):
    """Step 1: Use Gemini to generate 1-3 image prompts from simplified text."""
    messages = [
        {
            "role": "system",
            "content": """
You are an expert educational visual designer.

Your task is to generate highly accurate, curriculum-aligned visual prompts for students.

You must:
- Detect the academic subject automatically (science, history, geography, civics, economics, literature, mathematics, etc.).
- Adapt the visual style based on the subject.
- Prioritize textbook accuracy.
- Never invent facts, labels, events, people, or structures not mentioned in the source text.
- Return ONLY valid JSON.
"""
        },
        {
            "role": "user",
            "content": f"""
Analyze the following simplified educational text and generate 1–3 image prompts.

--------------------
SOURCE TEXT:
{simplified_text}
--------------------

GENERAL RULES (APPLY TO ALL SUBJECTS):

1. Each image must represent a distinct key concept from the text.
2. Do NOT invent facts, names, dates, structures, labels, or processes not explicitly stated.
3. Maintain historical, cultural, scientific, and contextual accuracy.
4. Keep prompts concise but descriptive (30–60 words).
5. White or neutral background unless context demands otherwise.
6. Avoid fantasy or dramatic artistic exaggeration.
7. Keep visuals classroom-appropriate and exam-aligned.

SUBJECT-SPECIFIC RULES:

If SCIENCE:
- Create clean textbook-style diagrams.
- Show correct spatial relationships.
- Arrows must indicate correct process direction.
- Include only labels explicitly mentioned.
- Avoid artistic distortion of proportions.

If HISTORY:
- Depict historically accurate clothing, setting, and time period.
- If a prominent person is mentioned, ensure realistic portrait style.
- No fictional elements.
- No invented events or symbols.
- If an event is described, show only what is mentioned.

If GEOGRAPHY:
- Accurate map orientation.
- Correct land-water relationships.
- Include only named features from text.
- No extra landmarks.

If CIVICS / POLITICAL SCIENCE:
- Use neutral, unbiased representation.
- If institutions are shown (parliament, court, etc.), represent them factually.
- Avoid symbolic exaggeration.

If ECONOMICS:
- Use simple charts or conceptual illustrations only if text mentions data or processes.
- No invented statistics.

If MATHEMATICS:
- Clean step-based visual representation.
- Only include formulas or variables present in text.
- No additional theorems.

If LITERATURE:
- Illustrate only scenes explicitly described.
- Avoid adding implied symbolism.
- Maintain narrative accuracy.

OUTPUT FORMAT (STRICT JSON ONLY):

{{
  "images": [
    {{
      "title": "Short concept title",
      "caption": "One sentence explaining why this visual helps student understanding.",
      "prompt": "Precise image generation prompt aligned with subject rules..."
    }}
  ]
}}
"""
        }
    ]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"}
        )
        data = json.loads(resp.choices[0].message.content)
        return data.get("images", [])

    except (OpenAIError, json.JSONDecodeError) as e:
        print(f"Error generating image prompts: {str(e)}")
        raise ValueError(f"Failed to generate image prompts: {str(e)}")


def generate_images_runware(prompts: list):
    """Step 2: Generate images via Runware API."""
    results = []

    for item in prompts:
        try:
            payload = [
                {
                    "taskType": "imageInference",
                    "taskUUID": _make_uuid(),
                    "positivePrompt": item["prompt"],
                    "width": 1024,
                    "height": 1024,
                    "model": "runware:100@1",   # fast general model, swap as needed
                    "numberResults": 1,
                    "outputFormat": "WEBP",
                    "includeCost": False
                }
            ]

            response = requests.post(
                RUNWARE_URL,
                headers={
                    "Authorization": f"Bearer {RUNWARE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=60
            )

            response.raise_for_status()
            data = response.json()

            # Runware returns { "data": [ { "imageURL": "...", ... } ] }
            image_url = data["data"][0]["imageURL"]

            results.append({
                "title": item["title"],
                "caption": item["caption"],
                "prompt": item["prompt"],
                "image_url": image_url,
                "image_b64": None
            })

        except Exception as e:
            print(f"Runware error for '{item['title']}': {str(e)}")
            results.append({
                "title": item["title"],
                "caption": item["caption"],
                "prompt": item["prompt"],
                "image_url": None,
                "image_b64": None,
                "error": str(e)
            })

    return results


def _make_uuid():
    import uuid
    return str(uuid.uuid4())