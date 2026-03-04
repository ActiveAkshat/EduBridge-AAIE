from flask import Blueprint, request, Response
from utils.response_formatter import error_response
from utils.gemini_client import initialize_mindmap_client   # reuse same Mistral client factory
from services.mindmap_explain_service import explain_mindmap

mindmap_explain_bp = Blueprint("mindmap_explain_bp", __name__)


@mindmap_explain_bp.route("/explain_mindmap", methods=["POST"])
def explain_mindmap_route():
    data = request.get_json()
    mindmap = data.get("mindmap")

    if not mindmap:
        return error_response("No mindmap data provided", 400)

    nodes = mindmap.get("nodes", [])
    if not nodes:
        return error_response("Mindmap has no nodes", 400)

    try:
        client = initialize_mindmap_client()   # same Mistral/OpenAI-compat client you already use
        audio_bytes = explain_mindmap(client, mindmap)

        return Response(
            audio_bytes,
            status=200,
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=mindmap_explanation.mp3",
                "Content-Length": str(len(audio_bytes)),
            },
        )

    except RuntimeError as e:
        return error_response(str(e), 500)
    except Exception as e:
        return error_response(f"Unexpected error: {e}", 500)