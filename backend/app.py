import io
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader

from classifier import simple_classify, suggest_reply

app = FastAPI(title="AutoU Email Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

class ProcessResponse(BaseModel):
    category: str
    reply: str
    preview: str

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    texts = []
    for page in reader.pages:
        try:
            texts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(texts).strip()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/process", response_model=ProcessResponse)
async def process_email(
    file: UploadFile | None = None,
    text: str | None = Form(default=None)
):
    content = ""
    if file and file.filename:
        data = await file.read()
        if file.filename.lower().endswith(".pdf"):
            content = extract_text_from_pdf(data)
        else:
            content = data.decode("utf-8", errors="ignore")
    elif text:
        content = text

    content = (content or "").strip()
    if not content:
        return ProcessResponse(
            category="Improdutivo",
            reply="Não foi possível ler conteúdo. Por favor, envie um .txt/.pdf válido ou cole o texto.",
            preview=""
        )

    category = simple_classify(content)
    reply = suggest_reply(category, content)
    preview = content[:400] + ("..." if len(content) > 400 else "")
    return ProcessResponse(category=category, reply=reply, preview=preview)
