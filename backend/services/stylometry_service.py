import re

def _normalize_newlines(text: str) -> str:
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join([ln.rstrip() for ln in text.split("\n")])
    return text.strip()

def _convert_star_bold(text: str) -> str:
    """
    Convert *word/phrase* -> **word/phrase** (single asterisk to double).
    Uses negative lookbehind/lookahead so existing **bold** is left alone.
    """
    pattern = re.compile(r"(?<!\*)\*(?!\*)([^\n*]{1,120})(?<!\*)\*(?!\*)")
    return pattern.sub(r"**\1**", text)

def _bold_term_definitions(text: str) -> str:
    """
    If a line looks like "Term: definition" bold just the term.
    Only applies to lines where the term looks like a real concept
    (starts with capital letter, is a noun-like phrase).
    """
    out_lines = []
    for ln in text.split("\n"):
        stripped = ln.strip()
        m = re.match(r"^\s*([A-Z][A-Za-z0-9 \-]{2,40})\s*:\s*(.+)$", stripped)
        if m:
            term = m.group(1).strip()
            rest = m.group(2).strip()
            out_lines.append(f"**{term}:** {rest}")
        else:
            out_lines.append(ln)
    return "\n".join(out_lines)

def _bullet_normalize(text: str) -> str:
    """
    Normalize various bullet styles to uniform "- " format.
    """
    lines = []
    for ln in text.split("\n"):
        s = ln.strip()
        if not s:
            lines.append("")
            continue

        if s.startswith(("• ", "● ", "▪ ", "– ", "— ")):
            lines.append("- " + s[2:].strip())
        elif re.match(r"^\u2022\s*", s):  # unicode bullet without space
            lines.append("- " + re.sub(r"^\u2022\s*", "", s).strip())
        elif re.match(r"^\d+\)\s+", s):
            # "1) point" -> "- point"
            lines.append("- " + re.sub(r"^\d+\)\s+", "", s).strip())
        elif re.match(r"^\d+\.\s+", s):
            # Keep numbered items as-is (e.g. activity questions)
            lines.append(s)
        else:
            lines.append(ln)
    return "\n".join(lines)

def _paragraph_spacing(text: str) -> str:
    """
    Ensure clean paragraph breaks:
    - Collapse 3+ blank lines to 2
    - Add blank line after section headings
    """
    text = re.sub(r"\n{3,}", "\n\n", text)

    lines = text.split("\n")
    out = []
    for i, ln in enumerate(lines):
        out.append(ln)
        s = ln.strip()

        # A heading: short, starts with capital/number, no trailing punctuation
        is_heading = (
            bool(re.match(r"^(?:\d+[\.\d]*\s+)?[A-Z][A-Za-z0-9 ,\-()]{3,}$", s))
            and len(s) <= 70
            and not s.endswith((".", "?", "!", ","))
        )
        if is_heading:
            if i + 1 < len(lines) and lines[i + 1].strip() != "":
                out.append("")

    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# NOTE: _light_keyword_bolding has been intentionally removed.
# It was bolding common structural words like "types", "features", "steps",
# "advantages" etc. even when they appeared mid-sentence, which made the
# output look cluttered and confusing for students.
# Bold emphasis should come only from:
#   1. The source content marking terms with *...*
#   2. Term-definition patterns (e.g. "Parenchyma: ...")
# This keeps bolding meaningful and educationally focused.


def stylometrize_text(text: str) -> str:
    """
    Returns markdown-like text ready for PDF rendering:
    - **bold** for important terms (from *...* or Term: pattern)
    - Paragraphs separated by blank lines
    - Normalized bullet points using "- " format
    - Clean heading spacing
    """
    text = _normalize_newlines(text)
    text = _convert_star_bold(text)
    text = _bold_term_definitions(text)
    text = _bullet_normalize(text)
    text = _paragraph_spacing(text)
    return text.strip()