from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from rag import extract_text, chunk_text, build_index, retrieve
from model import ask_model
import uvicorn

app = FastAPI(title="Contract Analysis AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store contract data in memory
contract_store = {}

@app.post("/upload")
async def upload_contract(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    text = extract_text(pdf_bytes)
    chunks = chunk_text(text)
    index = build_index(chunks)

    contract_store["chunks"] = chunks
    contract_store["index"] = index
    contract_store["filename"] = file.filename

    return {
        "message": "Contract uploaded successfully",
        "filename": file.filename,
        "total_chunks": len(chunks),
        "total_words": len(text.split())
    }

@app.post("/ask")
async def ask_question(question: str = Form(...)):
    if "chunks" not in contract_store:
        return {"error": "No contract uploaded yet"}

    chunks = contract_store["chunks"]
    index = contract_store["index"]

    relevant_chunks, chunk_ids = retrieve(question, index, chunks)
    context = " ".join(relevant_chunks)[:1500]
    answer = ask_model(context, question)

    return {
        "question": question,
        "answer": answer,
        "source_chunks": relevant_chunks,
        "chunk_ids": chunk_ids
    }

@app.post("/summary")
async def get_summary():
    if "chunks" not in contract_store:
        return {"error": "No contract uploaded yet"}

    chunks = contract_store["chunks"]
    context = " ".join(chunks[:4])[:1500]
    summary = ask_model(context, "Summarize this contract in 5 bullet points covering the most important terms.")

    return {"summary": summary}

@app.post("/risks")
async def get_risks():
    if "chunks" not in contract_store:
        return {"error": "No contract uploaded yet"}

    chunks = contract_store["chunks"]
    index = contract_store["index"]

    relevant_chunks, _ = retrieve("risky unusual penalty liability damages", index, chunks)
    context = " ".join(relevant_chunks)[:1500]
    risks = ask_model(context, "What are the potentially risky or unusual clauses the signing party should be aware of?")

    return {"risks": risks}

@app.post("/clauses")
async def extract_clauses():
    if "chunks" not in contract_store:
        return {"error": "No contract uploaded yet"}

    chunks = contract_store["chunks"]
    index = contract_store["index"]

    clause_questions = {
        "Governing Law": "What is the governing law?",
        "Payment Terms": "What are the payment terms?",
        "Termination": "What are the termination conditions?",
        "Confidentiality": "What are the confidentiality terms?",
        "Non-Compete": "What is the non-compete clause?",
        "Parties": "Who are the parties involved?"
    }

    clauses = {}
    for clause_name, question in clause_questions.items():
        relevant_chunks, _ = retrieve(question, index, chunks)
        context = " ".join(relevant_chunks)[:1500]
        clauses[clause_name] = ask_model(context, question)

    return {"clauses": clauses}

# Serve the built React frontend
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/")
def serve_root():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)