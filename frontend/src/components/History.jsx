import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function History({ userId, onSelectContract }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const q = query(
        collection(db, "contracts"),
        where("userId", "==", userId),
        orderBy("uploadedAt", "desc")
      );
      const snap = await getDocs(q);
      setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading history…</span></div>;
  if (contracts.length === 0) return (
    <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "12px 0" }}>
      No contracts yet. Upload your first one!
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {contracts.map(c => (
        <div key={c.id} className="clause-item"
          style={{ cursor: "pointer" }}
          onClick={() => onSelectContract(c)}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>
            📄 {c.filename}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {c.totalWords?.toLocaleString()} words · {new Date(c.uploadedAt?.toDate()).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}