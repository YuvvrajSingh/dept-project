import requests
import base64
import io
import re
from config import OLLAMA_BASE_URL, VISION_MODEL


PRIMARY_PROMPT = """You are reading a handwritten exam answer sheet image.
Extract only what is visibly written in the image.
Include diagram descriptions only if an actual diagram is visible.
Do not invent content, do not output coordinate arrays, and do not use canned/template examples.
If text is unreadable, return exactly: UNREADABLE
Return only the extracted answer text and diagram description."""

RETRY_PROMPT = """Read this exam answer sheet image again.
Return a plain transcription of visible handwritten text.
If there is a diagram, describe only labels and arrows that are clearly visible.
Never return bounding boxes, numbers-only arrays, or generic examples.
If unreadable, return exactly: UNREADABLE"""


def _looks_like_placeholder(text: str) -> bool:
    t = (text or "").strip().strip("'\"")
    if not t:
        return True

    # Pattern like: [0.17, 0.0, 0.83, 0.11]
    if re.fullmatch(r"\[\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){2,}\s*\]", t):
        return True

    low = t.lower()
    if low == "unreadable":
        return True

    # Common prompt-leak template from earlier prompt examples.
    if "diagram: box labeled input" in low and "hidden layer" in low and "output" in low:
        return True

    return False


def _call_ocr(prompt: str, image_data: str) -> str:
    response = requests.post(
        OLLAMA_BASE_URL + "/api/generate",
        json={
            "model": VISION_MODEL,
            "prompt": prompt,
            "images": [image_data],
            "stream": False,
            "options": {
                "num_ctx": 2048  # Limit context memory to help prevent CUDA out-of-memory errors
            }
        },
        timeout=1200  # Increased timeout from 300 to 1200 (20 minutes)
    )

    if response.status_code != 200:
        raise Exception(f"Ollama error: {response.status_code} - {response.text}")

    return (response.json().get("response") or "").strip()

def compress_image_for_ocr(image_path: str) -> str:
    """Image ko 1024px max mein compress karo — Ollama memory save hogi"""
    try:
        from PIL import Image as PILImage
        img = PILImage.open(image_path).convert("RGB")
        if img.width > 800 or img.height > 800:
            img.thumbnail((800, 800), PILImage.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        # Fallback: raw file
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

def extract_text_from_image(image_path):
    print(f"📸 Reading image: {image_path}")
    print(f"🤖 Using model: {VISION_MODEL}")

    image_data = compress_image_for_ocr(image_path)

    extracted = _call_ocr(PRIMARY_PROMPT, image_data)
    if _looks_like_placeholder(extracted):
        print("⚠️ OCR placeholder/template detected, retrying with stricter prompt...")
        extracted = _call_ocr(RETRY_PROMPT, image_data)

    if _looks_like_placeholder(extracted):
        print("⚠️ OCR remained low-confidence/unusable after retry.")
        extracted = ""

    print("✅ Text extracted!")
    return extracted