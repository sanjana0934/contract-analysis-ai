import { useState } from "react";
import Upload from "./components/Upload";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  const [contractUploaded, setContractUploaded] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);

  return (
    <div className="app">
      {!contractUploaded ? (
        <>
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark">⚖</div>
              <span className="brand-name">ContractAI</span>
            </div>
          </div>
          <Upload onUploadSuccess={(info) => { setContractInfo(info); setContractUploaded(true); }} />
        </>
      ) : (
        <Dashboard
          contractInfo={contractInfo}
          onReset={() => { setContractUploaded(false); setContractInfo(null); }}
        />
      )}
    </div>
  );
}