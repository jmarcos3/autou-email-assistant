# 📨 Email Assistant

Aplicação web simples para **classificação de e-mails** e **sugestão de respostas automáticas**, desenvolvida como parte do desafio prático da AutoU.

A aplicação permite o upload de arquivos `.txt` ou `.pdf` (ou a inserção direta de texto) e identifica se o e-mail é **Produtivo** ou **Improdutivo**, exibindo uma resposta sugerida com base na categoria detectada.

---

## 🚀 Tecnologias

- **Backend:** Python + FastAPI  
- **Frontend:** HTML + CSS + JS puro  
- **IA:** Google Gemini 2.0 Flash (via API)  
- **Hospedagem:** Frontend na Vercel • Backend na Render

---

## ⚙️ Como rodar localmente

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/jmarcos3/autou-email-assistant
cd autou-email-assistant/backend

python3 -m venv .venv
source .venv/bin/activate   # Linux
# ou
.venv\Scripts\activate      # Windows

pip install -r requirements.txt
```
### 2️⃣ Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `backend/`.

Exemplo:
```ini
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=512
GEMINI_TEMPERATURE=0.3
```

### 3️⃣ Iniciar o servidor backend
```bash uvicorn app:app --reload```

O backend rodará em **http://127.0.0.1:8000**

### 4️⃣ Rodar o frontend
Em outro terminal:
```bash 
cd ../frontend
python3 -m http.server 5173
```
Acesse **http://localhost:5173** no navegador.


### 🧪 Testar via API (sem frontend)
Depois de iniciar o backend (uvicorn app:app --reload), você pode testar diretamente os endpoints usando curl.

🔹 Enviar texto direto

```bash 
curl -X POST http://127.0.0.1:8000/process \
  -F 'text=Favor verificar o status do ticket #12345. Urgente.'
```
🔹 Enviar arquivo .txt

```bash
curl -X POST http://127.0.0.1:8000/process \
  -F 'file=@samples/produtivo.txt'
```
🔹 Enviar arquivo .pdf

```bash
curl -X POST http://127.0.0.1:8000/process \
  -F 'file=@samples/produtivo.pdf'
```
Resposta esperada (exemplo):

```json
{
  "category": "Produtivo",
  "reply": "Olá! Recebemos sua mensagem. Estamos verificando seu pedido e retornamos com uma atualização ou confirmação até o fim do dia útil. Se precisar, responda a este e-mail com mais detalhes ou anexos relevantes. Obrigado!",
  "preview": "Favor verificar o status do ticket #12345. Urgente.",
  "provider": "heuristic"
}

```
### 🧪 Rodar testes automatizados
Após instalar as dependências, execute:
```bash
pytest -v
```
---
### 📁 Estrutura do projeto

```pgsql

email-assistant/
├── backend/
│   ├── app.py
│   ├── classifier.py
│   ├── gemini_client.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── samples/
│   │   ├── borderline.txt
│   │   ├── improdutivo.txt
│   │   └── produtivo.pdf
│   │   └── produtivo.txt
│   └── tests/
│       └── test_api.py
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

