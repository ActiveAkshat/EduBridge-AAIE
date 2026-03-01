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
            "content": "You are an expert at creating clear, descriptive image prompts for educational visuals. Return only valid JSON."
        },
        {
            "role": "user",
            "content": f"""
Analyze the following simplified educational text and generate 1-3 image prompts that would create helpful conceptual visuals for students.

**Source Text:**
---
{simplified_text}
---

**Guidelines:**
1. Each prompt should visualize a distinct key concept from the text.
2. Prompts should describe clear, educational diagrams or illustrations — not photos.
3. Style: "clean educational illustration, minimalist, flat design, white background, labeled diagram"
4. Keep prompts concise but descriptive (30-50 words each).
5. Include a short title and a one-line caption for each image.

**Output (JSON only):**
{{
  "images": [
    {{
      "title": "Short concept title",
      "caption": "One sentence explaining what this image shows and why it helps",
      "prompt": "Detailed image generation prompt here..."
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