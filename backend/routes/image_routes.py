from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from utils.gemini_client import initialize_imageprompt_client
from services.image_service import generate_image_prompts, generate_images_runware


image_bp = Blueprint("image_bp", __name__)

@image_bp.route("/generate_images", methods=["POST"])
def generate_images_route():
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return error_response("No text provided", 400)

    client = initialize_imageprompt_client()

    try:
        prompts = generate_image_prompts(client, text)        # Gemini
        images = generate_images_runware(prompts)             # Runware

        return success_response({"images": images, "count": len(images)})
    except Exception as e:
        return error_response(str(e))