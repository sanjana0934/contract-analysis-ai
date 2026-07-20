import { useState } from "react";
import axios from "axios";

const QUICK = [
  "What are the payment terms?",
  "What is the governing law?",
  "What are the termination conditions?",
  "Who are the parties involved?",
  "What are the confidentiality terms?",
  "Are there any penalty clauses?",
];

export default function Dashboard({ contractInfo, onReset }) {
  const [tab, setTab] = useState("ask");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [risks, setRisks] = useState(null);
  const [clauses, setClauses] = useState(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true); setAnswer(null); setSources([]);
    try {
      const fd = new FormData(); fd.append("question", question);
      const res = await axios.post("http://localhost:8000/ask", fd);
      setAnswer(res.data.answer);
      setSources(res.data.source_chunks || []);
    } catch { setAnswer("Error getting answer. Please try again."); }
    finally { setLoading(false); }
  };

  const getSummary = async () => {
    setLoading(true); setSummary(null);
    try { const res = await axios.post("http://localhost:8000/summary"); setSummary(res.data.summary); }
    catch { setSummary("Error generating summary."); }
    finally { setLoading(false); }
  };

  const getRisks = async () => {
    setLoading(true); setRisks(null);
    try { const res = await axios.post("http://localhost:8000/risks"); setRisks(res.data.risks); }
    catch { setRisks("Error identifying risks."); }
    finally { setLoading(false); }
  };

  const getClauses = async () => {
    setLoading(true); setClauses(null);
    try { const res = await axios.post("http://localhost:8000/clauses"); setClauses(res.data.clauses); }
    catch { setClauses(null); }
    finally { setLoading(false); }
  };

  const nav = [
    { id: "ask",     icon: "💬", label: "Ask"         },
    { id: "summary", icon: "📝", label: "Summary"     },
    { id: "clauses", icon: "📋", label: "Key Clauses" },
    { id: "risks",   icon: "⚠️", label: "Risk Flags"  },
  ];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">⚖</div>
          <span className="brand-name">ContractAI</span>
        </div>
        <div className="topbar-center">
          <div className="file-dot" />
          <span className="file-name">{contractInfo?.filename}</span>
          <span className="file-meta">· {contractInfo?.total_chunks} sections · {contractInfo?.total_words?.toLocaleString()} words</span>
        </div>
        <button className="btn-outline" onClick={onReset}>Upload new</button>
      </div>

      {/* Body */}
      <div className="layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-label">Analysis</div>
          {nav.map(n => (
            <div key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="main">

          {/* Stats */}
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Sections</div>
              <div className="stat-value">{contractInfo?.total_chunks ?? "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Words</div>
              <div className="stat-value">{contractInfo?.total_words?.toLocaleString() ?? "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Status</div>
              <div className="stat-value" style={{ color: "var(--green)", fontSize: 14, paddingTop: 3 }}>Ready</div>
            </div>
          </div>

          {/* ASK */}
          {tab === "ask" && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Ask a question</div>
              </div>
              <div className="input-row">
                <input
                  className="input"
                  placeholder="e.g. What are the termination conditions?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askQuestion()}
                />
                <button className="btn-primary" onClick={askQuestion} disabled={loading || !question.trim()}>
                  Ask
                </button>
              </div>
              <div className="chips">
                {QUICK.map(q => (
                  <button key={q} className="chip" onClick={() => setQuestion(q)}>{q}</button>
                ))}
              </div>
              {loading && <div className="loading"><div className="spinner" /><span>Analyzing contract…</span></div>}
              {answer && (
                <div className="answer">
                  <div className="answer-eyebrow">Answer</div>
                  <div className="answer-body">{answer}</div>
                  {sources.length > 0 && (
                    <div className="sources">
                      {sources.slice(0, 3).map((_, i) => (
                        <span key={i} className="source-tag">chunk {i + 1}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUMMARY */}
          {tab === "summary" && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Contract Summary</div>
              </div>
              {!summary && !loading && (
                <button className="action-btn" onClick={getSummary}>
                  <span>📝</span> Generate summary
                </button>
              )}
              {loading && <div className="loading"><div className="spinner" /><span>Generating summary…</span></div>}
              {summary && <div className="answer-body">{summary}</div>}
            </div>
          )}

          {/* CLAUSES */}
          {tab === "clauses" && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Key Clauses</div>
              </div>
              {!clauses && !loading && (
                <button className="action-btn" onClick={getClauses}>
                  <span>📋</span> Extract clauses
                </button>
              )}
              {loading && <div className="loading"><div className="spinner" /><span>Extracting clauses… (takes ~2 min)</span></div>}
              {clauses && (
                <div className="clause-list">
                  {Object.entries(clauses).map(([name, val]) => (
                    <div key={name} className="clause-item">
                      <div className="clause-key">{name}</div>
                      <div className="clause-val">{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RISKS */}
          {tab === "risks" && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Risk Flags</div>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
                AI-identified clauses that may be risky for the signing party
              </p>
              {!risks && !loading && (
                <button className="action-btn" onClick={getRisks}>
                  <span>⚠️</span> Identify risks
                </button>
              )}
              {loading && <div className="loading"><div className="spinner" /><span>Scanning for risks…</span></div>}
              {risks && <div className="risk-box">{risks}</div>}
            </div>
          )}

        </div>
      </div>
    </>
  );
}