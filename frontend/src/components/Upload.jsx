import { useState, useRef } from "react";
import axios from "axios";

export default function Upload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload", formData);
      onUploadSuccess(res.data);
    } catch {
      setError("Upload failed. Make sure the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <div className="upload-icon">📄</div>
        <div className="upload-title">Analyze a contract</div>
        <div className="upload-sub">
          Upload any PDF contract to extract clauses,<br />identify risks, and get instant answers.
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
              <div className="spinner" />
              <span>Processing contract…</span>
            </div>
          ) : (
            <>
              <div className="drop-text">Drop PDF here or click to browse</div>
              <div className="drop-hint">PDF files only · Max 10MB</div>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />

        {error && <div className="upload-error">{error}</div>}
      </div>
    </div>
  );
}