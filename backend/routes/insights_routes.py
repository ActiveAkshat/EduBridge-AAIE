import json
from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_simplify_client
from services.insights_service import generate_insights

insights_bp = Blueprint("insights_bp", __name__)

@insights_bp.route("/generate_insights", methods=["POST"])
def generate_insights_route():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return error_response("No text provided", 400)

    client = initialize_simplify_client()
    try:
        raw = generate_insights(client, text)
        
        # Find JSON object in the response (handles mixed text)
        start_idx = raw.find('{')
        if start_idx == -1:
            return error_response("No JSON object found in response")
        
        # Find matching closing brace
        brace_count = 0
        end_idx = -1
        for i in range(start_idx, len(raw)):
            if raw[i] == '{':
                brace_count += 1
            elif raw[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx == -1:
            return error_response("Malformed JSON in response")
        
        json_str = raw[start_idx:end_idx]
        parsed = json.loads(json_str)
        return success_response(parsed)
    except Exception as e:
        return error_response(str(e))