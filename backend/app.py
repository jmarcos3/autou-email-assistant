import io,os
from fastapi import FastAPI, UploadFile, Form, File, HTTPException  
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from classifier import simple_classify, suggest_reply
from gemini_client import classify_with_gemini, generate_reply_with_gemini

MAX_UPLOAD_BYTES = int(float(os.getenv("MAX_UPLOAD_MB", "5")) * 1024 * 1024)  

app = FastAPI(title="Email Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ProcessResponse(BaseModel):
    category: str
    reply: str
    preview: str
    provider: str

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        texts = []
        for page in reader.pages:
            try:
                texts.append(page.extract_text() or "")
            except Exception:
                continue
        content = "\n".join(texts).strip()
        if content:
            return content
    except Exception:
        pass
    try:
        from pdfminer.high_level import extract_text as pdfminer_extract_text 
        return (pdfminer_extract_text(io.BytesIO(file_bytes)) or "").strip()
    except Exception:
        return ""

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini": bool(os.getenv("GOOGLE_API_KEY", "")),
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "max_upload_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
    }

@app.post("/process", response_model=ProcessResponse)
async def process_email(
    file: UploadFile | None = File(None),     
    text: str | None = Form(default=None),    
):
    if (file and text) or (not file and not text):
        raise HTTPException(status_code=400, detail="Envie 'file' OU 'text' (apenas um).")

    content = ""
    if file and file.filename:
        data = await file.read()

        if MAX_UPLOAD_BYTES and len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Arquivo acima do limite permitido.")

        fname = (file.filename or "").lower()
        if not (fname.endswith(".pdf") or fname.endswith(".txt")):
            raise HTTPException(status_code=400, detail="Formato não suportado. Use .txt ou .pdf.")

        if fname.endswith(".pdf"):
            content = extract_text_from_pdf(data)
        else:
            content = data.decode("utf-8", errors="ignore")
    else:
        content = (text or "").strip()

    if not content:
        return ProcessResponse(
            category="Improdutivo",
            reply="Não foi possível ler conteúdo. Envie um .txt/.pdf válido ou cole o texto.",
            preview="",
            provider="heuristic",
        )

    preview = content[:400] + ("..." if len(content) > 400 else "")

    category_ai = classify_with_gemini(content)
    if category_ai is not None:
        reply_ai = generate_reply_with_gemini(category_ai, content) or suggest_reply(category_ai, content)
        return ProcessResponse(category=category_ai, reply=reply_ai, preview=preview, provider="gemini")

    category = simple_classify(content)
    reply = suggest_reply(category, content)
    return ProcessResponse(category=category, reply=reply, preview=preview, provider="heuristic")