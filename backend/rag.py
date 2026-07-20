import fitz
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return " ".join(page.get_text() for page in doc)

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def build_index(chunks):
    embeddings = embedding_model.encode(chunks, show_progress_bar=False).astype("float32")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    return index

def retrieve(query: str, index, chunks, top_k: int = 3):
    q_emb = embedding_model.encode([query]).astype("float32")
    _, idxs = index.search(q_emb, top_k)
    return [chunks[i] for i in idxs[0]], idxs[0].tolist()