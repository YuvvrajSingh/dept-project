import requests
import json
import ast
import re
from sentence_transformers import SentenceTransformer, util
from config import OLLAMA_BASE_URL, GRADING_MODEL

# ✅ all-mpnet-base-v2 — better semantic understanding
# Force to CPU to save GPU VRAM for the big Ollama models.
# Embedding calculation is fast enough on CPU.
embedder = SentenceTransformer("all-mpnet-base-v2", device="cpu")

ENABLE_CLEANING = False


def _grade_from_percentage(percentage):
    if percentage >= 85:
        return "A"
    if percentage >= 70:
        return "B"
    if percentage >= 55:
        return "C"
    if percentage >= 40:
        return "D"
    return "F"


def _extract_json_object(raw_text):
    text = (raw_text or "").replace("```json", "").replace("```", "").strip()
    start = text.find("{")
    if start == -1:
        return None

    in_string = False
    escape = False
    depth = 0

    for i in range(start, len(text)):
        ch = text[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
            continue

        if ch == "{":
            depth += 1
            continue

        if ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    if depth > 0:
        # Recover from truncated output by appending missing closing braces.
        return text[start:] + ("}" * depth)

    return None


def _try_parse_grade_payload(raw_text):
    obj_text = _extract_json_object(raw_text)

    if obj_text:
        try:
            parsed = json.loads(obj_text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            try:
                parsed = ast.literal_eval(obj_text)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass

    marks_match = re.search(r'"?marks_awarded"?\s*:\s*(-?\d+(?:\.\d+)?)', raw_text or "", flags=re.IGNORECASE)
    grade_match = re.search(r'"?grade"?\s*:\s*"?([A-F])"?', raw_text or "", flags=re.IGNORECASE)
    feedback_match = re.search(r'"?feedback"?\s*:\s*"([^\"]*)"', raw_text or "", flags=re.IGNORECASE)

    if marks_match or grade_match or feedback_match:
        return {
            "marks_awarded": float(marks_match.group(1)) if marks_match else None,
            "grade": grade_match.group(1).upper() if grade_match else None,
            "feedback": feedback_match.group(1).strip() if feedback_match else None,
        }

    return None

def clean_ocr_text(raw_text, skip=not ENABLE_CLEANING):
    if skip:
        return raw_text

    prompt = "The following text was extracted from a handwritten exam answer sheet using OCR. It may contain spelling mistakes, garbled words, or OCR errors.\n\nPlease fix ONLY the OCR errors and spelling mistakes. Do NOT add any new information or change the meaning.\nReturn ONLY the corrected text, nothing else.\n\nRaw OCR text:\n" + raw_text

    response = requests.post(
        OLLAMA_BASE_URL + "/api/generate",
        json={"model": GRADING_MODEL, "prompt": prompt, "stream": False}
    )
    if response.status_code != 200:
        return raw_text
    return response.json()["response"].strip()

def get_similarity_score(student_answer, model_answer):
    s_emb = embedder.encode(student_answer, convert_to_tensor=True)
    m_emb = embedder.encode(model_answer, convert_to_tensor=True)
    score = util.cos_sim(s_emb, m_emb).item()
    return round(score * 100, 2)

def get_ai_grade(student_answer, model_answer, total_marks=10):
    # 1. Calculate Semantic Similarity first (Crucial for the AI context)
    similarity = get_similarity_score(student_answer, model_answer)
    print(f"📊 Semantic Similarity: {similarity}%")

    prompt = (
        "You are a fair university examiner. Your job is to evaluate CONCEPT UNDERSTANDING, not exact wording.\n\n"
        "Model Answer (reference):\n" + model_answer + "\n\n"
        "Student's Answer:\n" + student_answer + "\n\n"
        "Total marks for this question: " + str(total_marks) + "\n"
        "Semantic similarity score: " + str(similarity) + " (low score means different phrasing, not necessarily wrong answer)\n\n"
        "Grading rules:\n"
        "- Judge correctness on meaning and concepts, not phrasing match.\n"
        "- Different wording can still be fully correct.\n"
        "- Award marks accordingly based on conceptual correctness.\n"
        "- Do not over-penalize when wording differs from the model answer.\n"
        "- Only give very low marks if the answer is completely wrong or irrelevant.\n\n"
        "Respond ONLY in this exact JSON format, no extra text:\n"
        "{\n"
        "    \"marks_awarded\": <number>,\n"
        "    \"grade\": \"<A/B/C/D/F>\",\n"
        "    \"feedback\": \"<2-3 lines of constructive feedback>\"\n"
        "}"
    )

    try:
        response = requests.post(
            OLLAMA_BASE_URL + "/api/generate",
            json={"model": GRADING_MODEL, "prompt": prompt, "stream": False},
            timeout=300 # Extended timeout for grading
        )
        if response.status_code != 200:
            error_data = response.json() if response.text else {"error": "Empty response"}
            raise Exception(f"Ollama error {response.status_code}: {error_data.get('error', 'Unknown error')}")

        raw = response.json().get("response", "")
        result = _try_parse_grade_payload(raw)
        if not isinstance(result, dict):
            print(f"❌ AI Output was not JSON: {(raw or '').strip()}")
            return {
                "marks_awarded": 0.0,
                "grade": "F",
                "feedback": "AI output parsing fallback applied due to malformed response.",
                "similarity_score": similarity,
            }

        marks_awarded = float(result.get("marks_awarded") or 0)
        marks_awarded = max(0.0, min(marks_awarded, float(total_marks)))
        pct = (marks_awarded / float(total_marks) * 100.0) if float(total_marks) > 0 else 0.0

        result["marks_awarded"] = marks_awarded
        result["grade"] = str(result.get("grade") or _grade_from_percentage(pct)).upper()
        result["feedback"] = str(result.get("feedback") or "Concept-level evaluation completed.")
        result["similarity_score"] = similarity
        return result
        
    except Exception as e:
        print(f"❌ AI Engine Error: {e}")
        raise e