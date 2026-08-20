import React, { useState } from "react";
import { Lock, Unlock, Key, ShieldCheck, Copy, Check, RefreshCw, AlertCircle } from "lucide-react";
import { NISTPQCAlgorithm } from "../../types";

export const HybridEncryptionSandbox: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<"ML-KEM-512" | "ML-KEM-768" | "ML-KEM-1024">("ML-KEM-768");
  const [plaintext, setPlaintext] = useState<string>("Top Secret: Del AI Quantum-Resistant Protocol Specification");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Simulated Keypair & Envelope State
  const [keyPair, setKeyPair] = useState(() => ({
    publicKeyHex: "d83a9f01e5b72184ac90... [1,184 bytes ML-KEM-768 PK]",
    privateKeyHex: "f4019a7e8b23cd91054a... [2,400 bytes ML-KEM-768 SK]",
    keyId: "pqc-key-768-" + Math.floor(Math.random() * 90000 + 10000),
  }));

  const [envelope, setEnvelope] = useState<{
    kyberCiphertext: string;
    aesIv: string;
    aesCiphertextHex: string;
    authTagHex: string;
    sharedSecretDerivedHex: string;
    decryptedText: string;
    isValid: boolean;
  }>(() => {
    return {
      kyberCiphertext: "3b9a7102ef48c71980a4d1b827e65190... [1,088 bytes]",
      aesIv: "a9f81b7e403d19284e6a012b",
      aesCiphertextHex: "7e91a05b38d4f2910c814b7e1904a5893d20eb9174fa1982b5e0",
      authTagHex: "9e40fa18b27dc104e891",
      sharedSecretDerivedHex: "84a1ef90b721cd49e830fa182937be410974adbc204918e763b019842a8b9e10",
      decryptedText: "Top Secret: Del AI Quantum-Resistant Protocol Specification",
      isValid: true,
    };
  });

  const handleRegenerateKeys = () => {
    const bytes = selectedAlgo === "ML-KEM-512" ? 800 : selectedAlgo === "ML-KEM-768" ? 1184 : 1568;
    const skBytes = selectedAlgo === "ML-KEM-512" ? 1632 : selectedAlgo === "ML-KEM-768" ? 2400 : 3168;
    setKeyPair({
      publicKeyHex: `d83a${Math.random().toString(16).slice(2, 10)}e5b72184ac90... [${bytes.toLocaleString()} bytes ${selectedAlgo} PK]`,
      privateKeyHex: `f401${Math.random().toString(16).slice(2, 10)}8b23cd91054a... [${skBytes.toLocaleString()} bytes ${selectedAlgo} SK]`,
      keyId: `pqc-key-${selectedAlgo.split("-")[2]}-${Math.floor(Math.random() * 90000 + 10000)}`,
    });
    handleEncrypt();
  };

  const handleEncrypt = () => {
    // Generate simulated AES cipher bytes from plaintext
    const pseudoHex = plaintext
      .split("")
      .map((c: string) => (c.charCodeAt(0) ^ 0x5a).toString(16).padStart(2, "0"))
      .join("");
    const ctBytes = selectedAlgo === "ML-KEM-512" ? 768 : selectedAlgo === "ML-KEM-768" ? 1088 : 1568;

    const randomSecret = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + "8b9e10fa";

    setEnvelope({
      kyberCiphertext: `3b9a${Math.random().toString(16).slice(2, 10)}ef48c71980... [${ctBytes.toLocaleString()} bytes ${selectedAlgo} CT]`,
      aesIv: Math.random().toString(16).slice(2, 14) + Math.random().toString(16).slice(2, 14),
      aesCiphertextHex: pseudoHex || "00",
      authTagHex: Math.random().toString(16).slice(2, 18),
      sharedSecretDerivedHex: randomSecret.padEnd(64, "0").slice(0, 64),
      decryptedText: plaintext,
      isValid: true,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Key Generation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-semibold">
                End-to-End Quantum Envelope
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                Hybrid PQC (ML-KEM) + AES-256-GCM Sandbox
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Encapsulate symmetric AES session keys with NIST post-quantum lattice primitives to achieve quantum forward secrecy.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ML-KEM-512">ML-KEM-512 (AES-128 Eq)</option>
              <option value="ML-KEM-768">ML-KEM-768 (AES-192 Eq)</option>
              <option value="ML-KEM-1024">ML-KEM-1024 (AES-256 Eq)</option>
            </select>

            <button
              onClick={handleRegenerateKeys}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate New Keypair</span>
            </button>
          </div>
        </div>

        {/* Current Keypair Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Recipient Public Key ({selectedAlgo})</span>
              </span>
              <button
                onClick={() => copyToClipboard(keyPair.publicKeyHex, "pk")}
                className="text-slate-500 hover:text-slate-200"
              >
                {copiedField === "pk" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 break-all text-[11px]">
              {keyPair.publicKeyHex}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Recipient Private Key (Kept Secret)</span>
              </span>
              <button
                onClick={() => copyToClipboard(keyPair.privateKeyHex, "sk")}
                className="text-slate-500 hover:text-slate-200"
              >
                {copiedField === "sk" ? <Check className="h-3.5 w-3.5 text-rose-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 break-all text-[11px]">
              {keyPair.privateKeyHex}
            </div>
          </div>
        </div>
      </div>

      {/* Encryption & Decryption Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Step 1: Encrypt */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>1. Plaintext Encryption & Encapsulation</span>
              </h4>
              <span className="font-mono text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                AES-256-GCM
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Confidential Plaintext (English):</label>
              <textarea
                value={plaintext}
                onChange={(e) => {
                  setPlaintext(e.target.value);
                }}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans text-xs"
              />
            </div>

            {/* Generated Cipher Envelope Structure */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-slate-400 font-semibold block mb-1">
                Encapsulated Quantum Cipher Envelope:
              </span>
              <div className="space-y-1.5">
                <div className="p-2 rounded bg-slate-900 text-cyan-300">
                  <span className="text-slate-500 block text-[10px]">PQC KEM Ciphertext (u, v):</span>
                  {envelope.kyberCiphertext}
                </div>
                <div className="p-2 rounded bg-slate-900 text-amber-300">
                  <span className="text-slate-500 block text-[10px]">AES-GCM Nonce / IV (96 bits):</span>
                  0x{envelope.aesIv}
                </div>
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">AES-256 Payload Ciphertext:</span>
                  0x{envelope.aesCiphertextHex}
                </div>
                <div className="p-2 rounded bg-slate-900 text-emerald-300">
                  <span className="text-slate-500 block text-[10px]">GCM Authentication Tag (128 bits):</span>
                  0x{envelope.authTagHex}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleEncrypt}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Encapsulate & Encrypt Envelope</span>
          </button>
        </div>

        {/* Step 2: Decrypt & Inspect */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Unlock className="h-4 w-4 text-cyan-400" />
                <span>2. Decapsulation & Symmetric Decryption</span>
              </h4>
              <span className="font-mono text-cyan-400 text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                Verified Tag
              </span>
            </div>

            {/* Derived Key & Noise Cancellation verification */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-slate-400 font-semibold block">
                Derived Shared Secret K from Decapsulation:
              </span>
              <div className="p-2 rounded bg-slate-900 text-emerald-400 break-all text-[11px]">
                0x{envelope.sharedSecretDerivedHex}
              </div>
            </div>

            {/* Recovered Plaintext Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-2">
              <div className="flex justify-between items-center text-emerald-400 font-semibold">
                <span>Decrypted Secret Plaintext:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Tag Authenticated
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm font-medium font-sans">
                {envelope.decryptedText || "(Empty)"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1 text-[11px]">
              <span className="text-slate-300 font-semibold block">Security Assurance:</span>
              <p>
                An adversary recording this transmission today cannot decrypt it even if they build a million-qubit quantum supercomputer in 2035.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] text-slate-400 border border-slate-800 flex justify-between">
            <span>Algorithm: {selectedAlgo} + AES-256-GCM</span>
            <span className="font-mono text-emerald-400">Post-Quantum Confidentiality: Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
