import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ marginBottom: 18 }}>
          <div style={{
            width: 36, height: 36, background: "var(--accent)",
            borderRadius: 9, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, margin: "0 auto 14px",
            boxShadow: "0 0 16px rgba(79,142,255,0.3)"
          }}>⚖</div>
          <div className="login-title">ContractAI</div>
          <div className="login-sub">{isRegister ? "Create your account" : "Sign in to continue"}</div>
        </div>

        <input className="input-field" type="email" placeholder="Email address"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input-field" type="password" placeholder="Password (min 6 chars)"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()} />

        <button className="btn-full" onClick={handle}
          disabled={loading || !email || !password}>
          {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>

        {error && <div className="auth-error">{error}</div>}

        <div className="toggle-auth">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => { setIsRegister(!isRegister); setError(null); }}>
            {isRegister ? "Sign in" : "Register"}
          </span>
        </div>
      </div>
    </div>
  );
}