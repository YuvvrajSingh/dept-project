import requests
import base64
import io
from config import OLLAMA_BASE_URL, VISION_MODEL

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

    response = requests.post(
        OLLAMA_BASE_URL + "/api/generate",
        json={
            "model": VISION_MODEL,
            "prompt": """This is a handwritten exam answer sheet.
Extract ALL text AND describe any diagrams.
For diagrams: describe the shape, labels, arrows, and connections.
Example: 'Diagram: Box labeled INPUT → Box labeled HIDDEN LAYER → Box labeled OUTPUT'
Return ONLY extracted text and diagram descriptions, nothing else.""",
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

    extracted = response.json()["response"].strip()
    print("✅ Text extracted!")
    return extracted