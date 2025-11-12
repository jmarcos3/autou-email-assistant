import io
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert "status" in r.json()

def test_process_text_produtivo():
    payload = {"text": "Favor verificar o status do ticket #123. Urgente."}
    r = client.post("/process", data=payload)
    assert r.status_code == 200
    js = r.json()
    assert js["category"] in ["Produtivo", "Improdutivo"]
    assert "reply" in js

def test_process_txt_file():
    content = b"Apenas informando: sem demanda por enquanto."
    files = {"file": ("teste.txt", io.BytesIO(content), "text/plain")}
    r = client.post("/process", files=files)
    assert r.status_code == 200
    js = r.json()
    assert "category" in js

def test_mutual_exclusive():
    content = b"hello"
    files = {"file": ("t.txt", io.BytesIO(content), "text/plain")}
    r = client.post("/process", data={"text": "x"}, files=files)
    assert r.status_code == 400
