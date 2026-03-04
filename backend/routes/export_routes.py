import base64
import re
from io import BytesIO
from flask import Blueprint, request, send_file
from weasyprint import HTML, CSS
from utils.response_formatter import error_response

export_bp = Blueprint("export_bp", __name__)

# ---------- CSS ----------

BASE_CSS = CSS(string="""
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');

    @page {
        size: A4;
        margin: 18mm 18mm 18mm 18mm;
    }

    body {
        font-family: 'Nunito', 'Segoe UI', Arial, sans-serif;
        font-size: 12pt;
        color: #1a1a2e;
        line-height: 1.7;
        background: white;
    }

    h1.chapter-title {
        font-size: 22pt;
        font-weight: 700;
        color: #2c3e7a;
        border-bottom: 3px solid #2c3e7a;
        padding-bottom: 6px;
        margin-bottom: 18px;
        margin-top: 0;
    }

    h2.topic-title {
        font-size: 15pt;
        font-weight: 700;
        color: #1a5276;
        background: #eaf0fb;
        border-left: 5px solid #2c3e7a;
        padding: 6px 12px;
        margin-top: 22px;
        margin-bottom: 10px;
        border-radius: 0 6px 6px 0;
        page-break-after: avoid;
    }

    h3.section-heading {
        font-size: 12pt;
        font-weight: 700;
        color: #1a5276;
        margin-top: 14px;
        margin-bottom: 4px;
        page-break-after: avoid;
    }

    p {
        margin: 0 0 8px 0;
        text-align: justify;
    }

    ul {
        margin: 4px 0 10px 0;
        padding-left: 22px;
    }

    ul li {
        margin-bottom: 4px;
        line-height: 1.6;
    }

    .activity-box {
        background: #fffbea;
        border: 1.5px solid #f0c040;
        border-radius: 8px;
        padding: 10px 14px;
        margin: 12px 0;
        page-break-inside: avoid;
    }

    .activity-box .activity-title {
        font-weight: 700;
        color: #7d5a00;
        font-size: 11.5pt;
        margin-bottom: 6px;
    }

    .activity-box ol {
        margin: 4px 0 0 0;
        padding-left: 20px;
    }

    .activity-box ol li {
        margin-bottom: 3px;
    }

    .answer-label {
        font-weight: 700;
        color: #1a5276;
        margin-top: 8px;
    }

    strong {
        color: #1a3a6e;
        font-weight: 700;
    }

    .mindmap-section {
        margin-top: 16px;
        text-align: center;
        page-break-inside: avoid;
    }

    .mindmap-section img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 1px solid #dde3f0;
    }

    .topic-divider {
        border: none;
        border-top: 1.5px solid #dde3f0;
        margin: 18px 0 6px 0;
    }
""")

# ---------- Markdown-to-HTML Converter ----------

def _md_to_html(text: str) -> str:
    """
    Convert stylometrized markdown-ish text to clean HTML.
    Handles: **bold**, bullet lists (- ), numbered items,
    Activity blocks, Answer: labels, section headings.
    """
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not text:
        return ""

    # Strip leftover single asterisks (not double)
    text = re.sub(r"(?<!\*)\*(?!\*)([^\n*]{1,120})(?<!\*)\*(?!\*)", r"<strong>\1</strong>", text)
    # Convert **bold** to <strong>
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)

    html_parts = []
    blocks = re.split(r"\n\s*\n", text)

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        lines = block.split("\n")

        # --- Activity block detection ---
        if re.match(r"^Activity\s+[\d\.]+", lines[0].strip(), re.IGNORECASE):
            activity_title = lines[0].strip()
            rest_lines = lines[1:]

            inner_html = ""
            # Collect steps/questions inside activity
            bullet_items = []
            answer_lines = []
            in_answer = False

            for ln in rest_lines:
                s = ln.strip()
                if not s:
                    continue
                if s.lower().startswith("answer:") or s.lower() == "answer":
                    in_answer = True
                    answer_lines.append(s)
                elif in_answer:
                    answer_lines.append(s)
                elif s.startswith("- "):
                    bullet_items.append(s[2:].strip())
                elif re.match(r"^\d+\.\s+", s):
                    bullet_items.append(re.sub(r"^\d+\.\s+", "", s))
                else:
                    bullet_items.append(s)

            if bullet_items:
                inner_html += "<ol>" + "".join(f"<li>{_inline_md(li)}</li>" for li in bullet_items) + "</ol>"
            if answer_lines:
                inner_html += f'<div class="answer-label">{_inline_md(answer_lines[0])}</div>'
                for al in answer_lines[1:]:
                    inner_html += f"<p>{_inline_md(al)}</p>"

            html_parts.append(
                f'<div class="activity-box">'
                f'<div class="activity-title">{activity_title}</div>'
                f'{inner_html}'
                f'</div>'
            )
            continue

        # --- Pure bullet list block ---
        non_empty = [ln for ln in lines if ln.strip()]
        if non_empty and all(ln.strip().startswith("- ") for ln in non_empty):
            items = [_inline_md(ln.strip()[2:]) for ln in non_empty]
            html_parts.append("<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>")
            continue

        # --- Mixed block: process line by line ---
        block_html = ""
        i = 0
        while i < len(lines):
            ln = lines[i].strip()
            if not ln:
                i += 1
                continue

            # Answer label
            if re.match(r"^Answer\s*:", ln, re.IGNORECASE):
                block_html += f'<p class="answer-label">{_inline_md(ln)}</p>'

            # Bullet line
            elif ln.startswith("- "):
                # Collect consecutive bullet lines into a list
                bullet_group = []
                while i < len(lines) and lines[i].strip().startswith("- "):
                    bullet_group.append(_inline_md(lines[i].strip()[2:]))
                    i += 1
                block_html += "<ul>" + "".join(f"<li>{b}</li>" for b in bullet_group) + "</ul>"
                continue

            # Numbered item
            elif re.match(r"^\d+\.\s+", ln):
                block_html += f"<p style='margin-left:16px'>{_inline_md(ln)}</p>"

            # Section-like heading (short, bold-only line, ends with colon or all caps-ish)
            elif (
                len(ln) <= 80
                and not ln.endswith(".")
                and re.match(r"^[A-Z\*]", ln)
                and len(ln.split()) <= 10
                and not any(c in ln for c in [",", "(", "?"])
            ):
                clean = re.sub(r"\*+", "", ln)
                block_html += f'<h3 class="section-heading">{clean}</h3>'

            # Normal paragraph line
            else:
                block_html += f"<p>{_inline_md(ln)}</p>"

            i += 1

        if block_html:
            html_parts.append(block_html)

    return "\n".join(html_parts)


def _inline_md(text: str) -> str:
    """Apply inline markdown (bold only) to a single line."""
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)([^\n*]{1,120})(?<!\*)\*(?!\*)", r"<strong>\1</strong>", text)
    return text


def _build_html(title: str, body_html: str, template_b64: str = "") -> str:
    """Wrap body HTML in a full page HTML document."""
    bg_style = ""
    if template_b64:
        bg_style = f"""
        body {{
            background-image: url('{template_b64}');
            background-size: cover;
            background-repeat: no-repeat;
        }}
        """
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{bg_style}</style>
</head>
<body>
{body_html}
</body>
</html>"""


def _b64_to_data_url(data_url: str) -> str:
    """Return raw data URL as-is (already usable in HTML img src)."""
    return data_url or ""


def _render_pdf(html_string: str) -> BytesIO:
    pdf_bytes = HTML(string=html_string).write_pdf(stylesheets=[BASE_CSS])
    out = BytesIO(pdf_bytes)
    out.seek(0)
    return out


# ---------- Routes ----------

@export_bp.route("/export/notes/pdf", methods=["POST"])
def export_notes_pdf():
    data = request.get_json() or {}
    topic_name = data.get("topic_name", "Topic")
    content    = data.get("content", "")
    template_data_url = data.get("template_data_url", "")

    if not content:
        return error_response("No content provided", 400)

    body = f'<h1 class="chapter-title">{topic_name}</h1>\n'
    body += _md_to_html(content)

    html = _build_html(topic_name, body, template_data_url)
    out  = _render_pdf(html)
    return send_file(out, mimetype="application/pdf", as_attachment=True,
                     download_name=f"{topic_name}_notes.pdf")


@export_bp.route("/export/mindmap/pdf", methods=["POST"])
def export_mindmap_pdf():
    data = request.get_json() or {}
    topic_name = data.get("topic_name", "Topic")
    mindmap_data_url  = data.get("mindmap_image_data_url", "")
    template_data_url = data.get("template_data_url", "")

    if not mindmap_data_url:
        return error_response("No mindmap image provided", 400)

    body = f'<h1 class="chapter-title">{topic_name}</h1>\n'
    body += f'<div class="mindmap-section"><img src="{mindmap_data_url}" /></div>'

    html = _build_html(topic_name, body, template_data_url)
    out  = _render_pdf(html)
    return send_file(out, mimetype="application/pdf", as_attachment=True,
                     download_name=f"{topic_name}_mindmap.pdf")


@export_bp.route("/export/topic/combined/pdf", methods=["POST"])
def export_topic_combined_pdf():
    data = request.get_json() or {}
    topic_name = data.get("topic_name", "Topic")
    content    = data.get("content", "")
    mindmap_data_url  = data.get("mindmap_image_data_url", "")
    template_data_url = data.get("template_data_url", "")

    if not content:
        return error_response("No content provided", 400)
    if not mindmap_data_url:
        return error_response("No mindmap image provided", 400)

    body  = f'<h1 class="chapter-title">{topic_name}</h1>\n'
    body += _md_to_html(content)
    body += f'<div class="mindmap-section"><img src="{mindmap_data_url}" /></div>'

    html = _build_html(topic_name, body, template_data_url)
    out  = _render_pdf(html)
    return send_file(out, mimetype="application/pdf", as_attachment=True,
                     download_name=f"{topic_name}_combined.pdf")


@export_bp.route("/export/chapter/pdf", methods=["POST"])
def export_chapter_pdf():
    data = request.get_json() or {}
    chapter_title = data.get("chapter_title", "Chapter Notes")
    topics        = data.get("topics", [])
    template_data_url = data.get("template_data_url", "")

    if not topics or not isinstance(topics, list):
        return error_response("No topics provided", 400)

    body = f'<h1 class="chapter-title">{chapter_title}</h1>\n'

    for idx, t in enumerate(topics, start=1):
        topic_name = t.get("topic", f"Topic {idx}")
        content    = t.get("content", "")

        if idx > 1:
            body += '<hr class="topic-divider">'
        body += f'<h2 class="topic-title">{topic_name}</h2>\n'
        body += _md_to_html(content)

    html = _build_html(chapter_title, body, template_data_url)
    out  = _render_pdf(html)
    return send_file(out, mimetype="application/pdf", as_attachment=True,
                     download_name="chapter_notes.pdf")


@export_bp.route("/export/chapter/combined/pdf", methods=["POST"])
def export_chapter_combined_pdf():
    data = request.get_json() or {}
    chapter_title = data.get("chapter_title", "Chapter Notes + Mindmaps")
    topics        = data.get("topics", [])
    template_data_url = data.get("template_data_url", "")

    if not topics or not isinstance(topics, list):
        return error_response("No topics provided", 400)

    body = f'<h1 class="chapter-title">{chapter_title}</h1>\n'

    for idx, t in enumerate(topics, start=1):
        topic_name       = t.get("topic", f"Topic {idx}")
        content          = t.get("content", "")
        mindmap_data_url = t.get("mindmap_image_data_url", "")

        if idx > 1:
            body += '<hr class="topic-divider">'
        body += f'<h2 class="topic-title">{topic_name}</h2>\n'
        body += _md_to_html(content)

        if mindmap_data_url:
            body += f'<div class="mindmap-section"><img src="{mindmap_data_url}" /></div>\n'

    html = _build_html(chapter_title, body, template_data_url)
    out  = _render_pdf(html)
    return send_file(out, mimetype="application/pdf", as_attachment=True,
                     download_name="chapter_combined.pdf")