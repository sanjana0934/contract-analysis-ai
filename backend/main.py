from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rag import extract_text, chunk_text, build_index, retrieve
from model import ask_model
import firebase_admin
from firebase_admin import credentials, auth
import uvicorn

# ── Firebase Admin Init ──────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

app = FastAPI(title="Contract Analysis AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store contract data in memory per user
contract_store = {}

# ── Contract Validator ───────────────────────────
def is_contract(text: str) -> bool:
    contract_keywords = [
        "agreement", "contract", "party", "parties",
        "terms", "clause", "hereby", "obligations",
        "termination", "governing law", "confidential",
        "payment", "liability", "indemnify", "warranty",
        "signed", "execution", "jurisdiction", "breach",
        "damages", "intellectual property", "non-compete",
        "whereas", "witnesseth", "hereinafter", "lessor",
        "lessee", "employer", "employee", "vendor", "client"
    ]
    text_lower = text.lower()
    matches = sum(1 for kw in contract_keywords if kw in text_lower)
    return matches >= 3

# ── Auth helper ──────────────────────────────────
def verify_token(authorization: str):
    try:
        token = authorization.replace("Bearer ", "")
        decoded = auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Routes ───────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ContractAI backend running"}

@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    uid = verify_token(authorization)

    # Only accept PDFs
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    pdf_bytes = await file.read()
    text = extract_text(pdf_bytes)

    # Check if empty or scanned
    if len(text.strip()) < 50:
        raise HTTPException(400, "This PDF appears to be empty or scanned. Please upload a text-based PDF.")

    # Strict contract check — reject non-contracts
    if not is_contract(text):
        raise HTTPException(422, "This document does not appear to be a contract. Please upload a valid contract PDF such as a service agreement, NDA, employment contract, or lease agreement.")

    chunks = chunk_text(text)
    index = build_index(chunks)

    # Store per user
    contract_store[uid] = {
        "chunks": chunks,
        "index": index,
        "filename": file.filename
    }

    return {
        "message": "Contract uploaded successfully",
        "filename": file.filename,
        "total_chunks": len(chunks),
        "total_words": len(text.split()),
        "is_contract": True,
    }

@app.post("/ask")
async def ask_question(
    question: str = Form(...),
    authorization: str = Header(...)
):
    uid = verify_token(authorization)
    store = contract_store.get(uid)
    if not store:
        raise HTTPException(400, "No contract uploaded yet")

    chunks = store["chunks"]
    index = store["index"]

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
async def get_summary(authorization: str = Header(...)):
    uid = verify_token(authorization)
    store = contract_store.get(uid)
    if not store:
        raise HTTPException(400, "No contract uploaded yet")

    context = " ".join(store["chunks"][:4])[:1500]
    summary = ask_model(context, "Summarize this contract in 5 bullet points covering the most important terms.")
    return {"summary": summary}

@app.post("/risks")
async def get_risks(authorization: str = Header(...)):
    uid = verify_token(authorization)
    store = contract_store.get(uid)
    if not store:
        raise HTTPException(400, "No contract uploaded yet")

    relevant_chunks, _ = retrieve(
        "risky unusual penalty liability damages",
        store["index"], store["chunks"]
    )
    context = " ".join(relevant_chunks)[:1500]
    risks = ask_model(context, "What are the potentially risky or unusual clauses the signing party should be aware of?")
    return {"risks": risks}

@app.post("/clauses")
async def extract_clauses(authorization: str = Header(...)):
    uid = verify_token(authorization)
    store = contract_store.get(uid)
    if not store:
        raise HTTPException(400, "No contract uploaded yet")

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
        relevant_chunks, _ = retrieve(question, store["index"], store["chunks"])
        context = " ".join(relevant_chunks)[:1500]
        clauses[clause_name] = ask_model(context, question)

    return {"clauses": clauses}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)