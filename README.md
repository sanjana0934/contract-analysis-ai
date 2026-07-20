---
title: Contract Analysis AI
emoji: 📄
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Contract Analysis AI

An AI-powered contract analysis tool. Upload a contract, and it extracts key clauses, flags risks, and answers questions about the document using a local LLM (TinyLlama fine-tuned with LoRA) combined with retrieval-augmented generation (RAG).

## Features

- Upload contracts (PDF)
- Ask questions about the contract's content
- Automatic risk clause detection
- RAG-based retrieval over document content for grounded answers

## Tech Stack

Frontend: React (Vite)
Backend: FastAPI, Transformers, PEFT (LoRA), FAISS, PyMuPDF, Sentence-Transformers

## Project Structure

contract-analysis-ai/
- backend/ - FastAPI app, model and RAG logic
- frontend/ - React (Vite) UI
- Dockerfile - Combined build for deployment
- README.md

## Running Locally

Backend:

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

Frontend:

cd frontend
npm install
npm run dev

## Deployment

Deployed as a Docker-based Hugging Face Space, building the React frontend and serving it through the FastAPI backend on a single port.