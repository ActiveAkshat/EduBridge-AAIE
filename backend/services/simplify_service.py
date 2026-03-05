from utils.gemini_client import MODEL
from services.stylometry_service import stylometrize_text


# Maps learning level key → plain-English description used inside the prompt
LEVEL_DESCRIPTIONS = {
    "beginner":     "a complete beginner with little prior knowledge of the subject",
    "intermediate": "a student with some foundational knowledge who is building deeper understanding",
    "advanced":     "an advanced learner comfortable with technical vocabulary and complex concepts",
}


def simplify_text(client, text: str, learner_profile: dict = None):
    """
    Simplify NCERT textbook content using Gemini via OpenAI-compatible interface
    + stylometry formatting.

    learner_profile (optional dict):
        age          : int or None
        grade        : int or None
        learningLevel: "beginner" | "intermediate" | "advanced"
        language     : "english" | "hindi"
    """

    # ── Build learner context block ─────────────────────────────────────────
    profile = learner_profile or {}
    level   = profile.get("learningLevel", "beginner")
    age     = profile.get("age")
    grade   = profile.get("grade")
    language = profile.get("language", "english")

    level_desc = LEVEL_DESCRIPTIONS.get(level, LEVEL_DESCRIPTIONS["beginner"])

    learner_lines = [f"- The student is {level_desc}."]
    if grade:
        learner_lines.append(f"- The student is in Grade / Class {grade}.")
    if age:
        learner_lines.append(f"- The student is approximately {age} years old.")

    learner_context = "\n".join(learner_lines)

    # ── Level-specific writing instructions ─────────────────────────────────
    if level == "beginner":
        style_instructions = (
            "- Use the simplest possible vocabulary; avoid all jargon.\n"
            "- Break every idea into very small steps.\n"
            "- Use relatable, everyday analogies to explain abstract concepts.\n"
            "- Keep sentences short (under 15 words where possible).\n"
        )
    elif level == "intermediate":
        style_instructions = (
            "- Use clear language but introduce subject-specific terms with brief definitions.\n"
            "- Explain ideas step by step, building on prior knowledge.\n"
            "- Use examples where helpful; analogies are welcome but not required.\n"
            "- Sentences can be moderate in length.\n"
        )
    else:  # advanced
        style_instructions = (
            "- Use accurate technical vocabulary without over-explaining basic terms.\n"
            "- Focus on depth, nuance, and connections between concepts.\n"
            "- Examples and analogies are optional; prioritise precision.\n"
            "- Sentences can be complex where the subject demands it.\n"
        )

    # ── Language instruction ─────────────────────────────────────────────────
    if language == "hindi":
        language_instruction = "- Write the entire simplified explanation in Hindi (हिंदी).\n"
    else:
        language_instruction = "- Write the entire simplified explanation in English.\n"

    # ── Full prompt ──────────────────────────────────────────────────────────
    prompt = (
        "Rewrite the following NCERT textbook content in simplified language "
        "tailored to the learner described below.\n\n"
        "Learner profile:\n"
        f"{learner_context}\n\n"
        "Writing style guidelines:\n"
        f"{style_instructions}"
        "General guidelines:\n"
        "- Keep the explanation accurate to the original meaning.\n"
        "- Do NOT add greetings, questions, or conversational phrases.\n"
        "- Do NOT address the reader directly.\n"
        "- Do NOT add motivational or emotional language.\n"
        "- Write in a neutral, textbook-style explanatory tone.\n"
        "- Preserve the exact text inside *...* markers (do not rewrite those words).\n"
        "- Keep paragraph breaks where the topic changes.\n"
        f"{language_instruction}\n"
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
        formatted  = stylometrize_text(simplified)
        return formatted
    except Exception as e:
        return f"Error simplifying text: {str(e)}"