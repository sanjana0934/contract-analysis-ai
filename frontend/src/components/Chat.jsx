import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import axios from "axios";

const QUICK = [
  "Summarize this contract",
  "What are the payment terms?",
  "What is the governing law?",
  "What are the termination conditions?",
  "Who are the parties involved?",
  "What are the confidentiality terms?",
  "Are there any penalty clauses?",
  "What are the risky clauses?",
];

export default function Chat({ contract, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  // Load chat history from Firestore when contract changes
  useEffect(() => {
    setMessages([]);
    setHistoryLoaded(false);
    loadHistory();
  }, [contract.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const q = query(
        collection(db, "contracts", contract.id, "conversations"),
        orderBy("timestamp", "asc")
      );
      const snap = await getDocs(q);
      const history = [];

      // Add welcome message first
      history.push({
        id: "welcome",
        role: "ai",
        text: `I've analyzed **${contract.filename}** — ${contract.totalWords?.toLocaleString()} words across ${contract.totalChunks} sections. Ask me anything about this contract.`,
        isWelcome: true
      });

      snap.docs.forEach(d => {
        const data = d.data();
        history.push({ id: d.id + "_q", role: "user", text: data.question });
        history.push({ id: d.id + "_a", role: "ai", text: data.answer, sources: data.sources || [] });
      });

      setMessages(history);
    } catch (e) {
      console.error("Failed to load history", e);
      setMessages([{
        id: "welcome",
        role: "ai",
        text: `I've analyzed **${contract.filename}**. Ask me anything about this contract.`,
      }]);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");

    // Add user message
    const userMsg = { id: Date.now() + "_u", role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const fd = new FormData();
      fd.append("question", q);

      const res = await axios.post("http://localhost:8000/ask", fd, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const answer = res.data.answer;
      const sources = res.data.source_chunks || [];

      const aiMsg = { id: Date.now() + "_a", role: "ai", text: answer, sources };
      setMessages(prev => [...prev, aiMsg]);

      // Save to Firestore
      await addDoc(collection(db, "contracts", contract.id, "conversations"), {
        question: q,
        answer,
        sources: sources.map((s, i) => `chunk ${i + 1}`),
        timestamp: serverTimestamp()
      });

    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + "_err",
        role: "ai",
        text: "Sorry, I couldn't process that. Make sure the backend is running.",
        isError: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const initials = user.email?.charAt(0).toUpperCase();

  const formatText = (text) => {
    // Bold **text**
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <>
      {/* Chat topbar */}
      <div className="chat-topbar">
        <div>
          <div className="chat-topbar-title">{contract.filename}</div>
          <div className="chat-topbar-meta">
            {contract.totalChunks} sections · {contract.totalWords?.toLocaleString()} words
          </div>
        </div>
        <div className="topbar-right">
          <button className="tab-pill" onClick={() => send("Summarize this contract in 5 bullet points")}>
            📝 Summary
          </button>
          <button className="tab-pill" onClick={() => send("What are the risky or unusual clauses?")}>
            ⚠️ Risks
          </button>
          <button className="tab-pill" onClick={() => send("Extract the key clauses: governing law, payment terms, termination, confidentiality, parties involved")}>
            📋 Clauses
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {!historyLoaded && (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <div className="loading"><div className="spinner" /><span>Loading history…</span></div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.role === "user" ? "user" : ""}`}>
            <div className={`msg-avatar ${msg.role === "ai" ? "ai" : "user-av"}`}>
              {msg.role === "ai" ? "⚖" : initials}
            </div>
            <div className="msg-content">
              <div className="msg-name">{msg.role === "ai" ? "ContractAI" : "You"}</div>
              <div
                className="msg-bubble"
                style={msg.isError ? { borderColor: "var(--red-border)", background: "var(--red-dim)" } : {}}
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
              {msg.sources?.length > 0 && (
                <div className="msg-sources">
                  {msg.sources.slice(0, 3).map((s, i) => (
                    <span key={i} className="msg-source-tag">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg-row">
            <div className="msg-avatar ai">⚖</div>
            <div className="msg-content">
              <div className="msg-name">ContractAI</div>
              <div className="msg-bubble">
                <div className="typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="input-bar">
        {messages.length <= 1 && (
          <div className="quick-chips">
            {QUICK.map(q => (
              <button key={q} className="quick-chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}
        <div className="input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything about this contract…"
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
            ↑
          </button>
        </div>
      </div>
    </>
  );
}