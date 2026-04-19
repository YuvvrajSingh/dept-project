import requests
import json
from sentence_transformers import SentenceTransformer, util
from config import OLLAMA_BASE_URL, GRADING_MODEL

# ✅ all-mpnet-base-v2 — better semantic understanding
# Force to CPU to save GPU VRAM for the big Ollama models.
# Embedding calculation is fast enough on CPU.
embedder = SentenceTransformer("all-mpnet-base-v2", device="cpu")

ENABLE_CLEANING = False

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

def get_max_marks_from_similarity(similarity, total_marks):
    if similarity >= 90:
        cap = 0.9
    elif similarity >= 80:
        cap = 0.8
    elif similarity >= 70:
        cap = 0.7
    elif similarity >= 60:
        cap = 0.6
    elif similarity >= 50:
        cap = 0.5
    else:
        cap = 0.4
    return round(total_marks * cap)

def get_ai_grade(student_answer, model_answer, total_marks=10):
    # 1. Calculate Semantic Similarity first (Crucial for the AI context)
    similarity = get_similarity_score(student_answer, model_answer)
    print(f"📊 Semantic Similarity: {similarity}%")
    
    max_marks = get_max_marks_from_similarity(similarity, total_marks)

    prompt = (
        "You are a fair university examiner. Your job is to evaluate CONCEPT UNDERSTANDING, not exact wording.\n\n"
        "Model Answer (reference):\n" + model_answer + "\n\n"
        "Student's Answer:\n" + student_answer + "\n\n"
        "Total marks for this question: " + str(total_marks) + "\n"
        "Maximum marks you can award: " + str(max_marks) + " (based on semantic similarity)\n\n"
        "Grading rules:\n"
        "- You MUST award " + str(max_marks) + " if the student completely understood the concept (even in different words).\n"
        "- You CANNOT award more than " + str(max_marks) + " marks.\n"
        "- Judge whether the student understood the CONCEPT — different wording is fine.\n"
        "- Award marks generously for partial knowledge within this limit.\n"
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

        raw = response.json()["response"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        
        # Robust JSON extraction
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            print(f"❌ AI Output was not JSON: {raw}")
            raise Exception("AI response format error")
            
        result = json.loads(raw[start:end])
        result['marks_awarded'] = min(float(result['marks_awarded']), float(max_marks))
        return result
        
    except Exception as e:
        print(f"❌ AI Engine Error: {e}")
        raise e