"""
AI Coach chat endpoint.

Pitch-deck v1: gives GENERALIZED calisthenics coaching answers only — it does
not read the user's profile, routines, or logged sets yet. That's the natural
Phase 2 upgrade (see the note in SYSTEM_PROMPT) once this is proven out.

Setup:
    pip install anthropic
    Add ANTHROPIC_API_KEY to your .env (same place JWT_SECRET_KEY etc. live)

Wire-up (in app.py, alongside the other blueprints):
    from routes.coach import coach_bp
    app.register_blueprint(coach_bp, url_prefix="/api/coach")
"""

import os
from flask import Blueprint, request, jsonify
import anthropic

coach_bp = Blueprint("coach", __name__)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are the AI Coach inside Feel The Burn, a calisthenics \
training app. You help users with bodyweight training: exercise form cues, \
progressions (e.g. how to work toward a pull-up, pistol squat, or muscle-up), \
programming principles, warm-ups, and general recovery/nutrition basics.

You do NOT currently have access to this specific user's profile, workout \
history, or goals — that personalization is coming in a later version. If \
someone asks something that really needs that context (e.g. "what should I \
lift today"), give the best general-purpose answer you can and briefly note \
that personalized coaching using their actual logs is on the way.

Keep replies short and practical: 2-4 sentences for simple questions, a \
short paragraph plus a few concrete bullet-style tips for progressions. \
Plain text only, no markdown headers. Encouraging but not over-the-top."""


@coach_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []  # [{role: "user"|"assistant", content: str}, ...]

    if not message:
        return jsonify({"error": "message is required"}), 400

    # Only pass through well-formed turns, and cap history length so a long
    # demo conversation doesn't balloon token usage.
    messages = []
    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": f"Coach is unavailable right now: {str(e)}"}), 502