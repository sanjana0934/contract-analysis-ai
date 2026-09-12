import { useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";

export default function Upload({ user, onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file."); return;
    }
    setUploading(true); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = await user.getIdToken();
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const docRef = await addDoc(collection(db, "contracts"), {
        userId: user.uid,
        filename: file.name,
        totalChunks: res.data.total_chunks,
        totalWords: res.data.total_words,
        uploadedAt: serverTimestamp(),
      });

      onUploadSuccess({ ...res.data, contract_id: docRef.id });

    } catch (e) {
      // Show specific error from backend
      const msg = e.response?.data?.detail ||
        "Upload failed. Make sure the backend is running.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <div style={{ fontSize: 32, marginBottom: 16 }}>📄</div>
        <div className="upload-title">Upload a contract</div>
        <div className="upload-sub">
          Drop a contract PDF to analyze clauses,<br />identify risks, and get instant answers.
        </div>

        <div
          className={`drop-zone ${dragging ? "active" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          {uploading ? (
            <div className="loading" style={{ justifyContent: "center" }}>
              <div className="spinner" /><span>Processing contract…</span>
            </div>
          ) : (
            <>
              <div className="drop-text">Drop PDF here or click to browse</div>
              <div className="drop-hint">Contracts only · PDF files only</div>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />

        {/* Error — shown for non-contracts too */}
        {error && (
          <div style={{
            marginTop: 12, padding: "12px 14px",
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            borderRadius: 8, fontSize: 12,
            color: "var(--red)", lineHeight: 1.6,
            textAlign: "left"
          }}>
            ❌ {error}
          </div>
        )}

        {/* Supported types */}
        <div style={{
          marginTop: 16, padding: "10px 14px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 8, fontSize: 11,
          color: "var(--text-tertiary)", lineHeight: 1.8,
          textAlign: "left"
        }}>
          <div style={{ color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>✅ Supported documents:</div>
          Service agreements · NDAs · Employment contracts<br />
          Lease agreements · Vendor contracts · MSAs
        </div>
      </div>
    </div>
  );
}