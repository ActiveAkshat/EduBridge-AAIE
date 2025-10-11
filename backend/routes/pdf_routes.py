from flask import Blueprint, request
from utils.response_formatter import success_response, error_response
from services.text_service import extract_text_from_pdf
from utils.gemini_client import initialize_openai_client
from services.text_service import generate_json_dataset

pdf_bp = Blueprint("pdf_bp", __name__)

@pdf_bp.route("/upload_pdf", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return error_response("No file uploaded", 400)

    file = request.files["file"]
    if file.filename == "":
        return error_response("No file selected", 400)

    try:
        text = extract_text_from_pdf(file)
        client = initialize_openai_client()
        dataset = generate_json_dataset(client, text)

        if "error" in dataset:
            return error_response(dataset["error"])

        return success_response(dataset, "PDF processed successfully")
    except Exception as e:
        return error_response(str(e))