from utils.gemini_client import PROJECT_ID, LOCATION, ENDPOINT_ID

def simplify_text(client, text):
    endpoint_name = f"projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/{ENDPOINT_ID}"

    prompt = (
        "You are a friendly teacher helping children with learning disabilities "
        "understand NCERT concepts. Your job is to rewrite the text in a way that is:\n"
        "- Very simple and clear.\n"
        "- Positive, supportive, and encouraging.\n"
        "- Uses examples from everyday life.\n"
        "- Explains ideas step by step.\n\n"
        f"Here is the text to simplify:\n{text}\n\n"
        "Now rewrite it in this simple, child-friendly way."
    )

    response = client.models.generate_content(model=endpoint_name, contents=prompt)
    return response.text
