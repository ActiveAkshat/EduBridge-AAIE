import json
from openai import OpenAIError
from utils.gemini_client import MODEL

def generate_mindmap_code(client, text: str):
    messages = [
        {
            "role": "system",
            "content": "You are an expert educational content designer and a precise JSON-generating machine. Your sole purpose is to create a valid, parsable JSON object based on the user's request."
        },
        {
            "role": "user",
            "content": f"""
Create a beautiful, student-friendly mind map from the text provided below.

**Task:**
1. Analyze the text and deconstruct it into a clear hierarchy: one main topic (root), subtopics, and details.
2. Follow all guidelines to populate the nodes and links.

**Source Text:**
---
{text}
---

**Guidelines:**
1. **Hierarchy:** The structure must be logical and intuitive for a learner.
2. **Concise Text:** Keep node text short (3–5 words) and student-friendly.
3. **Visuals:** Use the provided color palette and add a relevant emoji to every node. 
   Color Palette: #FF6B6B (red), #4ECDC4 (teal), #45B7D1 (blue), #FFA07A (orange), #98D8C8 (mint), #FFD93D (yellow), #A8E6CF (green), #8B5CF6 (purple), #EC4899 (pink)
4. **Descriptions:** Include a helpful description (15-25 words) for each node that explains the concept clearly. This will show on hover.
5. **Connections:** Ensure all links logically connect related concepts.

**Layout Rules:**
1. Prefer a wider (not deeper) structure to avoid long node chains.
2. Create 1 root node, 4-7 main subtopic nodes, and optionally 2-3 detail nodes per subtopic.
3. Focus on key ideas, not every minor detail.

**Output Rules:**
1. Return ONLY a single, valid JSON object.
2. No markdown, no extra commentary, no code blocks.
3. No trailing commas.
4. All keys/strings must use double quotes.
5. IMPORTANT: The 'key' field must be an INTEGER, not a string.

**JSON Format:**
{{
  "nodes": [
    {{"key": 1, "text": "Main Topic", "color": "#8B5CF6", "emoji": "🎯", "description": "This is the central concept that ties all subtopics together and provides the foundation for understanding"}},
    {{"key": 2, "text": "Subtopic One", "color": "#4ECDC4", "emoji": "📌", "description": "First important aspect covering key fundamentals and basic principles of the main topic"}}
  ],
  "links": [
    {{"from": 1, "to": 2}}
  ]
}}

**Critical Requirements:**
- Use INTEGER keys (1, 2, 3...), not strings
- Every node MUST have: key, text, color, emoji, AND description
- Descriptions should be informative and helpful for students
- Use diverse colors from the palette for visual appeal
"""
        }
    ]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"}
        )
        msg = resp.choices[0].message.content
        mindmap_data = json.loads(msg)
        
        # Validate structure
        if 'nodes' not in mindmap_data or 'links' not in mindmap_data:
            raise ValueError("Invalid mindmap structure: missing 'nodes' or 'links'")
        
        # Ensure all nodes have required fields with better defaults
        color_palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#A8E6CF', '#8B5CF6', '#EC4899']
        
        for i, node in enumerate(mindmap_data['nodes']):
            # Ensure key is integer
            if 'key' in node and isinstance(node['key'], str):
                node['key'] = int(node['key']) if node['key'].isdigit() else i + 1
            elif 'key' not in node:
                node['key'] = i + 1
            
            # Add description if missing
            if 'description' not in node or not node['description']:
                node['description'] = f"Key concept: {node.get('text', 'Topic')}. Hover for more details about this important area."
            
            # Add color if missing
            if 'color' not in node or not node['color']:
                node['color'] = color_palette[i % len(color_palette)]
            
            # Add emoji if missing
            if 'emoji' not in node or not node['emoji']:
                node['emoji'] = '📌'
        
        # Validate links reference existing node keys
        valid_keys = {node['key'] for node in mindmap_data['nodes']}
        mindmap_data['links'] = [
            link for link in mindmap_data['links']
            if link.get('from') in valid_keys and link.get('to') in valid_keys
        ]
        
        return mindmap_data
        
    except (OpenAIError, json.JSONDecodeError, ValueError) as e:
        print(f"Error generating mindmap: {str(e)}")
        return {"error": str(e)}