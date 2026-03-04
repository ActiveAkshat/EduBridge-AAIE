# backend/services/explain_service.py

import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def explain_flashcard(client, question: str, answer: str, language: str = "english"):
    """
    Generate explanation for a flashcard answer.
    Can include examples or fun facts if relevant.
    """
    
    # Language-specific prompt
    if language.lower() == "hindi":
        system_prompt = "आप एक शिक्षक हैं जो छात्रों को सरल भाषा में समझाते हैं।"
        user_prompt = f"""इस प्रश्न और उत्तर के लिए एक सरल व्याख्या दें।

प्रश्न: {question}
उत्तर: {answer}

निर्देश:
- सरल, स्पष्ट भाषा का उपयोग करें
- यदि संभव हो तो एक उदाहरण या रोचक तथ्य शामिल करें
- छोटे वाक्य (15 शब्दों तक)
- 2-4 वाक्यों में व्याख्या दें

JSON format में उत्तर दें:
{{
  "explanation": "यहाँ व्याख्या लिखें"
}}

केवल वैध JSON लौटाएं।"""
    else:
        system_prompt = "You are a teacher explaining concepts to students in simple language."
        user_prompt = f"""Provide a simple explanation for this flashcard.

Question: {question}
Answer: {answer}

Instructions:
- Use simple, clear language suitable for students
- Include an example or fun fact ONLY if it helps understanding
- Keep sentences short (max 15 words each)
- Keep explanation brief (2-4 sentences total)
- For factual questions (dates, numbers, names), skip examples and just elaborate briefly

Return in JSON format:
{{
  "explanation": "Your explanation here"
}}

Return ONLY valid JSON with no extra text."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.4  # Lower temperature for more focused responses
        )
        
        msg = resp.choices[0].message.content
        result = json.loads(msg)
        
        # Ensure the response has the expected structure
        if 'explanation' not in result:
            return {"explanation": "Unable to generate explanation."}
        
        return result
        
    except (OpenAIError, json.JSONDecodeError) as e:
        return {"error": str(e)}