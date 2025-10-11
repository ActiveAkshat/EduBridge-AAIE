import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def generate_mindmap_code(client, text: str):
    messages = [
        {
            "role": "system",
            "content": "You are an expert educational content designer and a precise JSON-generating machine. Your sole purpose is to create a valid, parsable JSON object based on the user's request."
        },
        {
            "role": "user",
            "content": f"""
    Create a beautiful, student-friendly mind map from the text provided below.

    **Task:**
    1.  Analyze the text and deconstruct it into a clear hierarchy: one main topic (root), subtopics, and details.
    2.  Follow all guidelines to populate the nodes and links.

    **Source Text:**
    ---
    {text}
    ---

    **Guidelines:**
    1.  **Hierarchy:** The structure must be logical and intuitive for a learner.
    2.  **Concise Text:** Keep node text short (3–5 words) and student-friendly.
    3.  **Visuals:** Use the provided color palette and add a relevant emoji to every node. (Palette: #FF6B6B, #4ECDC4, #45B7D1, #FFA07A, #98D8C8, #FFD93D, #A8E6CF).
    4.  **Descriptions:** Include a short, helpful description (10–15 words) for each node.
    5.  **Connections:** Ensure all links logically connect related concepts.

    **Layout Rules:**
    1. Prefer a wider (not deeper) structure to avoid long node chains.
    2. Focus on key ideas, not every minor detail.

    **Output Rules:**
    1. Return ONLY a single, valid JSON object.
    2. No markdown, no extra commentary.
    3. No trailing commas.
    4. All keys/strings must use double quotes.

    **JSON Format:**
    {{
      "nodes": [
        {{"key": "string", "text": "string", "color": "string", "emoji": "string", "description": "string"}}
      ],
      "links": [
        {{"from": "string", "to": "string"}}
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
    except OpenAIError as e:
        print(f"❌ API error: {e}")
        return {"error": str(e)}

    msg = resp.choices[0].message.content

    try:
        code = json.loads(msg)
    except json.JSONDecodeError:
        print("❌ JSON parse error. Raw output:")
        print(msg)
        return {"error": "Invalid JSON output", "raw": msg}

    return code

