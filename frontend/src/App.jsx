import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebase";
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, getDocs as getSubDocs } from "firebase/firestore";
import Login from "./components/Login";
import Upload from "./components/Upload";
import Chat from "./components/Chat";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [activeContract, setActiveContract] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) loadContracts(u.uid);
    });
  }, []);

  const loadContracts = async (uid) => {
    try {
      const q = query(
        collection(db, "contracts"),
        where("userId", "==", uid),
        orderBy("uploadedAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContracts(list);
    } catch (e) {
      console.error("Failed to load contracts", e);
    }
  };

  const handleUploadSuccess = (info) => {
    const newContract = {
      id: info.contract_id,
      filename: info.filename,
      totalChunks: info.total_chunks,
      totalWords: info.total_words,
      uploadedAt: { toDate: () => new Date() }
    };
    setContracts(prev => [newContract, ...prev]);
    setActiveContract(newContract);
    setShowUpload(false);
  };

  const handleDelete = async (e, contractId) => {
    e.stopPropagation(); // don't open the contract
    if (!window.confirm("Delete this contract and all its chat history?")) return;

    setDeletingId(contractId);
    try {
      // Delete all conversations subcollection
      const convsSnap = await getDocs(collection(db, "contracts", contractId, "conversations"));
      await Promise.all(convsSnap.docs.map(d => deleteDoc(d.ref)));

      // Delete the contract itself
      await deleteDoc(doc(db, "contracts", contractId));

      // Update state
      setContracts(prev => prev.filter(c => c.id !== contractId));
      if (activeContract?.id === contractId) {
        setActiveContract(null);
        setShowUpload(false);
      }
    } catch (e) {
      console.error("Failed to delete", e);
      alert("Failed to delete contract. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setContracts([]);
    setActiveContract(null);
  };

  if (authLoading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loading"><div className="spinner" /><span>Loading…</span></div>
    </div>
  );

  if (!user) return <Login onLogin={() => {}} />;

  const initials = user.email?.charAt(0).toUpperCase();

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="brand-mark">⚖</div>
            <span className="brand-name">ContractAI</span>
          </div>
          <button className="new-btn" onClick={() => { setShowUpload(true); setActiveContract(null); }}>
            <span className="new-btn-icon">+</span>
            New contract
          </button>
        </div>

        {contracts.length > 0 && (
          <div className="sidebar-section-label">Recent</div>
        )}

        <div className="sidebar-list">
          {contracts.map(c => (
            <div
              key={c.id}
              className={`chat-item ${activeContract?.id === c.id ? "active" : ""}`}
              onClick={() => { setActiveContract(c); setShowUpload(false); }}
            >
              <span className="chat-item-icon">📄</span>
              <div className="chat-item-text">
                <div className="chat-item-name">{c.filename}</div>
                <div className="chat-item-meta">
                  {c.totalWords?.toLocaleString()} words ·{" "}
                  {c.uploadedAt?.toDate
                    ? c.uploadedAt.toDate().toLocaleDateString()
                    : "Just now"}
                </div>
              </div>
              {/* Delete button */}
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, c.id)}
                disabled={deletingId === c.id}
                title="Delete contract"
              >
                {deletingId === c.id ? "…" : "🗑"}
              </button>
            </div>
          ))}

          {contracts.length === 0 && !showUpload && (
            <div style={{ padding: "20px 12px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>
              No contracts yet.<br />Upload one to get started.
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="user-avatar">{initials}</div>
            <span className="user-email">{user.email}</span>
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="chat-area">
        {showUpload ? (
          <Upload user={user} onUploadSuccess={handleUploadSuccess} />
        ) : activeContract ? (
          <Chat contract={activeContract} user={user} />
        ) : (
          <div className="welcome">
            <div className="welcome-icon">⚖️</div>
            <div className="welcome-title">ContractAI</div>
            <div className="welcome-sub">
              Upload a contract to start analyzing.<br />
              Ask questions, get summaries, identify risks.
            </div>
            <button
              style={{
                marginTop: 16, padding: "9px 20px",
                background: "var(--accent)", color: "#fff",
                border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                fontFamily: "Inter, sans-serif", cursor: "pointer"
              }}
              onClick={() => setShowUpload(true)}
            >
              + Upload a contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
}