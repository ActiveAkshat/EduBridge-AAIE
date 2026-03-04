import os
import json
import requests
from openai import OpenAIError


ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")  # Default: "George" – change as needed
ELEVENLABS_MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5")       # Fast + high quality


def generate_mindmap_explanation(mistral_client, mindmap_data: dict) -> str:

    nodes = mindmap_data.get("nodes", [])
    links = mindmap_data.get("links", [])

    # Build a human-readable summary of the mindmap structure for the prompt
    node_map = {n["key"]: n for n in nodes}

    # Find root (node not referenced as a "to" target, or key==1)
    all_targets = {lnk["to"] for lnk in links}
    root_nodes = [n for n in nodes if n["key"] not in all_targets]
    root = root_nodes[0] if root_nodes else nodes[0] if nodes else {}

    # Build child relationships
    children = {}
    for lnk in links:
        children.setdefault(lnk["from"], []).append(lnk["to"])

    def describe_tree(key, depth=0):
        node = node_map.get(key)
        if not node:
            return ""
        indent = "  " * depth
        desc = node.get("description", "")
        text = node.get("text", "")
        emoji = node.get("emoji", "")
        line = f"{indent}{emoji} {text}: {desc}"
        child_lines = []
        for child_key in children.get(key, []):
            child_lines.append(describe_tree(child_key, depth + 1))
        return "\n".join([line] + child_lines)

    tree_text = describe_tree(root.get("key", 1)) if root else json.dumps(nodes, indent=2)

    prompt = f"""You are an enthusiastic, friendly AI teacher explaining a mind map to a student.

Here is the mind map structure you need to explain:

{tree_text}

Your task:
1. Start with a warm, engaging introduction about the main topic.
2. Walk through each major subtopic naturally — as if you're guiding the student through the map.
3. For each subtopic, give a clear, simple explanation (2-3 sentences) and connect it back to the main idea.
4. Use analogies or examples where helpful to make concepts stick.
5. End with a short summary that ties everything together.

IMPORTANT RULES:
- Speak conversationally, like a real teacher talking out loud — NOT reading bullet points.
- Do NOT use markdown, asterisks, headers, or special characters.
- Do NOT say "according to the mindmap" or "as shown in the diagram" — just explain naturally.
- Keep the total explanation between 200 and 350 words — concise but thorough.
- Make it engaging and memorable for a student."""

    messages = [
        {
            "role": "system",
            "content": "You are a warm, engaging AI teacher who explains complex topics clearly and memorably. You always speak in plain, natural language suitable for text-to-speech."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        from utils.gemini_client import MODEL  # reuse the same model constant (Mistral via OpenAI-compat client)
        resp = mistral_client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=600,
        )
        explanation = resp.choices[0].message.content.strip()
        print(f"[MindmapExplain] Generated explanation ({len(explanation)} chars)")
        return explanation

    except (OpenAIError, Exception) as e:
        print(f"[MindmapExplain] Mistral error: {e}")
        raise RuntimeError(f"Failed to generate explanation: {e}")


def text_to_speech_elevenlabs(text: str) -> bytes:
    """
    Convert text to speech using ElevenLabs API.
    Returns raw MP3 audio bytes.
    """

    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY environment variable is not set.")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": 0.50,
            "similarity_boost": 0.75,
            "style": 0.20,
            "use_speaker_boost": True,
        },
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        print(f"[MindmapExplain] ElevenLabs TTS success, audio size: {len(response.content)} bytes")
        return response.content

    except requests.exceptions.HTTPError as e:
        err_body = e.response.text if e.response else "No response body"
        print(f"[MindmapExplain] ElevenLabs HTTP error: {e} — {err_body}")
        raise RuntimeError(f"ElevenLabs TTS failed: {e} — {err_body}")

    except requests.exceptions.RequestException as e:
        print(f"[MindmapExplain] ElevenLabs request error: {e}")
        raise RuntimeError(f"ElevenLabs TTS request failed: {e}")


def explain_mindmap(mistral_client, mindmap_data: dict) -> bytes:
    """
    Full pipeline: mindmap JSON → Mistral explanation → ElevenLabs audio bytes.
    """
    explanation = generate_mindmap_explanation(mistral_client, mindmap_data)
    audio_bytes = text_to_speech_elevenlabs(explanation)
    return audio_bytes