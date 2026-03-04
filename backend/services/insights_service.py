from utils.gemini_client import MODEL

def generate_insights(client, text: str):
    """Generate key insights from simplified NCERT topic content."""
    prompt = (
        "Analyze the following educational content and extract key insights.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        "  \"summary\": \"A 2-3 sentence overview of the topic\",\n"
        "  \"insights\": [\n"
        "    {\n"
        "      \"title\": \"Short insight title\",\n"
        "      \"description\": \"1-2 sentence explanation\",\n"
        "      \"emoji\": \"relevant emoji\",\n"
        "      \"type\": \"one of: definition | process | fact | cause-effect | example | formula\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Guidelines:\n"
        "- Extract 4 to 7 insights maximum.\n"
        "- Make it very interesting. If nothing interesting related to it skip.\n"
        "- Each insight must be distinct and meaningful.\n"
        "- Keep titles short (3-6 words).\n"
        "- Descriptions must be clear and concise.\n"
        "- Choose the most fitting emoji for each insight.\n"
        "- Do NOT wrap in markdown code blocks.\n"
        "- Return ONLY valid JSON.\n\n"
        f"Content:\n{text}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating insights: {str(e)}"