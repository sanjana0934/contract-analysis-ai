---
title: Contract Analysis AI
emoji: 📄
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# 📄 Contract Analysis AI

An AI-powered contract analysis tool that extracts key clauses, flags risks, and answers questions about uploaded contracts using a locally fine-tuned LLM combined with retrieval-augmented generation (RAG).

![React](https://img.shields.io/badge/Frontend-React%20(Vite)-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## ✨ Features

- 📤 Upload contracts (PDF)
- 💬 Ask natural-language questions about the contract's content
- ⚠️ Automatic risk clause detection
- 🔍 RAG-based retrieval over document content for grounded, hallucination-resistant answers
- 🔐 Firebase authentication (mom & family-style user login)
- 🗑️ Delete uploaded contracts
- 🚫 Blocks non-contract documents from being processed

---

## 🛠️ Tech Stack

| Layer      | Technologies |
|------------|-------------|
| **Frontend** | React (Vite), Firebase Auth |
| **Backend**  | FastAPI, Transformers, PEFT (LoRA), FAISS, PyMuPDF, Sentence-Transformers |
| **Model**    | TinyLlama fine-tuned with LoRA |
| **Deployment** | Docker |

---

## 📁 Project Structure

```
contract-analysis-ai/
├── backend/          # FastAPI app, model & RAG logic
│   ├── main.py
│   ├── model.py
│   ├── rag.py
│   └── requirements.txt
├── frontend/         # React (Vite) UI
│   └── src/
├── Dockerfile         # Combined build for deployment
└── README.md
```

---

## 🚀 Running Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:8000` (backend API, by default).

---

## 🐳 Docker

This project is set up for containerized deployment (e.g. on Hugging Face Spaces):

```bash
docker build -t contract-analysis-ai .
docker run -p 7860:7860 contract-analysis-ai
```

---

## 📝 License

MIT