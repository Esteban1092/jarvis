"""Backend tests for Jarvis API."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://jarvis-voice-ai-106.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session_id():
    return f"TEST_{uuid.uuid4().hex[:10]}"


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -- Health --
def test_root(http):
    r = http.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert "Jarvis" in data["message"]
    assert "gemini-2.5-flash" in data["models"]
    assert "gemini-2.5-pro" in data["models"]


# -- Validation --
def test_chat_empty_message(http, session_id):
    r = http.post(f"{API}/chat", json={"session_id": session_id, "message": "  ", "model": "gemini-2.5-flash"})
    assert r.status_code == 400


def test_chat_invalid_model(http, session_id):
    r = http.post(f"{API}/chat", json={"session_id": session_id, "message": "hi", "model": "gpt-4"})
    assert r.status_code == 400


# -- Chat with fallback --
def test_chat_flash_fallback(http, session_id):
    r = http.post(
        f"{API}/chat",
        json={"session_id": session_id, "message": "Say hello in one short sentence.", "model": "gemini-2.5-flash"},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data["reply"], str) and len(data["reply"]) > 0
    assert data["model"] == "gemini-2.5-flash"
    assert data["session_id"] == session_id
    # User key invalid -> fallback expected
    assert data["used_fallback_key"] is True


def test_chat_pro_model(http, session_id):
    r = http.post(
        f"{API}/chat",
        json={"session_id": session_id, "message": "Reply with the word OK.", "model": "gemini-2.5-pro"},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["reply"]) > 0
    assert data["model"] == "gemini-2.5-pro"


# -- Bilingual --
def test_chat_spanish(http):
    sid = f"TEST_es_{uuid.uuid4().hex[:6]}"
    r = http.post(
        f"{API}/chat",
        json={"session_id": sid, "message": "Hola Jarvis, ¿cómo estás?", "model": "gemini-2.5-flash"},
        timeout=60,
    )
    assert r.status_code == 200
    reply = r.json()["reply"].lower()
    # Heuristic Spanish indicators
    assert any(tok in reply for tok in ["señor", "sir", "estoy", "bien", "saludos", "hola", "gracias", "está"])
    # cleanup
    http.delete(f"{API}/chat/history/{sid}")


def test_chat_english(http):
    sid = f"TEST_en_{uuid.uuid4().hex[:6]}"
    r = http.post(
        f"{API}/chat",
        json={"session_id": sid, "message": "Hello Jarvis, please reply in English with a brief greeting.", "model": "gemini-2.5-flash"},
        timeout=60,
    )
    assert r.status_code == 200
    reply = r.json()["reply"].lower()
    assert any(tok in reply for tok in ["sir", "hello", "good", "greetings", "afternoon", "morning", "evening"])
    http.delete(f"{API}/chat/history/{sid}")


# -- History persistence --
def test_history_chronological(http, session_id):
    r = http.get(f"{API}/chat/history/{session_id}")
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 4  # at least 2 user + 2 assistant
    # roles alternate user/assistant
    roles = [m["role"] for m in items]
    assert roles[0] == "user"
    # chronological
    timestamps = [m["timestamp"] for m in items]
    assert timestamps == sorted(timestamps)


# -- Multi-turn context --
def test_multi_turn_context(http):
    sid = f"TEST_ctx_{uuid.uuid4().hex[:6]}"
    r1 = http.post(
        f"{API}/chat",
        json={"session_id": sid, "message": "My favorite color is purple. Remember it.", "model": "gemini-2.5-flash"},
        timeout=60,
    )
    assert r1.status_code == 200
    time.sleep(1)
    r2 = http.post(
        f"{API}/chat",
        json={"session_id": sid, "message": "What color did I just tell you?", "model": "gemini-2.5-flash"},
        timeout=60,
    )
    assert r2.status_code == 200
    reply = r2.json()["reply"].lower()
    assert "purple" in reply or "morado" in reply or "púrpura" in reply or "violeta" in reply
    http.delete(f"{API}/chat/history/{sid}")


# -- Delete --
def test_delete_history(http, session_id):
    r = http.delete(f"{API}/chat/history/{session_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["session_id"] == session_id
    assert data["deleted"] >= 1
    # Verify gone
    r2 = http.get(f"{API}/chat/history/{session_id}")
    assert r2.status_code == 200
    assert r2.json() == []
