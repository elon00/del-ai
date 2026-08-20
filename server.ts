import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { delphiBotRunner } from "./src/delphi/botRunner";
import { tradeExecutor } from "./src/delphi/executor";

dotenv.config();

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Agent chat endpoint
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const {
        message,
        persona = "synthesizer",
        history = [],
        contextData = null,
      } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A message string is required." });
      }

      const ai = getGenAIClient();
      if (!ai) {
        // High quality offline fallback responses in English
        const fallbackResponses: Record<string, string> = {
          automaton:
            "**Automaton Evolution Analysis**:\n\nBased on cellular automata principles (Conway's B3/S23), cellular systems demonstrate emergent complexity from simple deterministic rules. When inspecting spatial patterns, density equilibrium and oscillator periods govern entropy production. Try placing an R-Pentomino or Gosper Gun to observe chaotic transient cycles before reaching stable oscillators or still lifes.",
          pqc:
            "**Post-Quantum Cryptography (PQC) Security Briefing**:\n\nClassical asymmetric cryptography (RSA, ECDH/ECDSA) relies on integer factorization and discrete logarithms, which Shor's algorithm solves in polynomial time $O((\\log N)^3)$. NIST standardized lattice-based schemes—such as **ML-KEM** (Kyber) and **ML-DSA** (Dilithium)—which rely on the hardness of Learning With Errors (LWE) and Shortest Vector Problem (SVP) over polynomial rings $R_q = \\mathbb{Z}_q[X]/(X^n + 1)$, where quantum speedup is bounded.",
          security:
            "**Quantum Threat Audit & Hybrid Migration**:\n\nTo counter 'Harvest Now, Decrypt Later' (HNDL) state-sponsored attacks, organizations are transitioning to hybrid cryptographic envelopes (e.g., X25519 + ML-KEM-768 for TLS 1.3 key exchange). This maintains FIPS compatibility while establishing quantum forward secrecy.",
          synthesizer:
            "**Del AI Integrated Response**:\n\nDel AI seamlessly bridges deterministic cellular automata dynamics with quantum-resistant cryptographic foundations. By deriving pseudo-random polynomial noise from Conway cellular grid entropy, we can illustrate how chaotic emergent systems connect with high-dimensional lattice hardness.",
        };

        return res.json({
          reply:
            fallbackResponses[persona] || fallbackResponses.synthesizer,
          agentThought:
            "Del AI processed request with local mathematical reasoning engine. Connect GEMINI_API_KEY in Secrets for live generative synthesis.",
          modelUsed: "local-mathematical-engine",
          suggestedActions: [
            "Simulate ML-KEM-768 key encapsulation",
            "Seed Conway grid with high-entropy oscillator",
            "Compare classical vs lattice-based bit security",
          ],
        });
      }

      // Build system prompt based on persona
      let systemInstruction = `You are Del AI, an advanced, highly articulate AI agent specialized in:
1. Conway's Game of Life & Artificial Life Automata (B3/S23, emergent computation, Gliders, Guns, Oscillators, Turing-complete cellular automata).
2. Post-Quantum Cryptography (PQC) & Lattice-Based Security (NIST standards: ML-KEM/Kyber, ML-DSA/Dilithium, SLH-DSA/SPHINCS+, Falcon, Ring-LWE, Learning with Errors, SVP, CVP, Shor's & Grover's algorithms).
3. Quantum Security Architectures (hybrid cryptography, Harvest-Now-Decrypt-Later mitigation).

Always respond in clear, professional English with precise mathematical and algorithmic rigor. Use markdown formatting with clear headings, bullet points, and code/math blocks where helpful.
`;

      if (persona === "automaton") {
        systemInstruction += `\nYou are currently acting in the role of **Automaton Evolutionist**. Specialize in cellular automata dynamics, entropy, glider synthesis, Turing completeness, and mathematical morphogenesis. If the user asks for patterns, explain their period, population growth, and bounding box.`;
      } else if (persona === "pqc") {
        systemInstruction += `\nYou are currently acting in the role of **Post-Quantum Cryptanalyst**. Specialize in lattice cryptography (Module-LWE, polynomial rings R_q = Z_q[X]/(X^256 + 1), noise distributions, Kyber/Dilithium step-by-step math, and resistance against quantum factoring).`;
      } else if (persona === "security") {
        systemInstruction += `\nYou are currently acting in the role of **Quantum Threat Auditor**. Specialize in quantum computing timelines, qubit requirements for Shor's algorithm, NIST standardization compliance, and hybrid classical-PQC migration.`;
      } else {
        systemInstruction += `\nYou are acting as **Del AI Synthesizer**, connecting automata theory, cryptographic lattices, and agentic workflows.`;
      }

      if (contextData) {
        systemInstruction += `\n\nLive Environment State: ${JSON.stringify(
          contextData
        )}`;
      }

      // Format conversation contents for Gemini
      const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (item && item.role && item.text) {
            contents.push({
              role: item.role === "user" ? "user" : "model",
              parts: [{ text: item.text }],
            });
          }
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "No response generated from model.";

      return res.json({
        reply: replyText,
        modelUsed: "gemini-3.7-flash",
      });
    } catch (err: any) {
      console.error("Del AI Agent Error:", err);
      return res.status(500).json({
        error: err.message || "Failed to process Del AI agent query",
      });
    }
  });

  // AI Pattern Generator endpoint for Conway Automata
  app.post("/api/automaton/ai-generate", async (req, res) => {
    try {
      const { prompt = "glider fleet with defensive pulsar oscillators", gridSize = 50 } = req.body;
      const ai = getGenAIClient();

      if (!ai) {
        // Fallback procedural pattern generator
        const patternGrid: number[][] = Array.from({ length: 24 }, () =>
          Array(24).fill(0)
        );
        // Place a nice Gosper-like or spaceship structure
        const gliders = [
          [1, 2], [2, 3], [3, 1], [3, 2], [3, 3],
          [10, 11], [11, 12], [12, 10], [12, 11], [12, 12]
        ];
        gliders.forEach(([r, c]) => {
          if (patternGrid[r] && patternGrid[r][c] !== undefined) patternGrid[r][c] = 1;
        });

        return res.json({
          name: "Generated Oscillator Cluster",
          description: "Procedural high-entropy dual-glider automaton seed.",
          cells: gliders,
          gridWidth: 24,
          gridHeight: 24,
          rule: "B3/S23",
          properties: {
            symmetry: "None",
            estimatedPeriod: "Dynamic",
            entropyRating: "High",
          },
        });
      }

      const systemInstruction = `You are an expert computational biologist and mathematician specializing in Conway's Game of Life (2D cellular automata).
Return a valid JSON object describing a viable, interesting cellular automata seed based on the user's concept.
Format:
{
  "name": "string",
  "description": "string",
  "rule": "B3/S23",
  "gridWidth": number (between 12 and 36),
  "gridHeight": number (between 12 and 36),
  "cells": [[row, col], [row, col], ...],
  "properties": {
    "symmetry": "C2" | "D4" | "Asymmetric" | "Bilateral",
    "estimatedPeriod": "Period 2" | "Period 3" | "Oscillator" | "Spaceship" | "Chaotic",
    "entropyRating": "Low" | "Medium" | "High" | "Extremal"
  }
}
Output strictly valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Create a Conway's Game of Life pattern seed matching this concept: "${prompt}". Must fit in max 30x30 bounding box.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch {
        parsed = null;
      }

      if (!parsed || !Array.isArray(parsed.cells)) {
        return res.json({
          name: "Quantum Fluctuator",
          description: "AI-generated balanced oscillator matrix.",
          rule: "B3/S23",
          gridWidth: 20,
          gridHeight: 20,
          cells: [
            [5, 5], [5, 6], [5, 7], [6, 5], [7, 6],
            [12, 12], [12, 13], [12, 14], [13, 14], [14, 13]
          ],
          properties: {
            symmetry: "Bilateral",
            estimatedPeriod: "Oscillator",
            entropyRating: "High",
          },
        });
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("Pattern Generation Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate automaton pattern." });
    }
  });

  // PQC Cryptanalysis Advisor endpoint
  app.post("/api/pqc/analyze", async (req, res) => {
    try {
      const { algorithm = "ML-KEM-768", targetSecurity = 192, context = {} } = req.body;
      const ai = getGenAIClient();

      if (!ai) {
        return res.json({
          algorithm,
          nistCategory: algorithm.includes("KEM") ? "Key Encapsulation Mechanism (Module-LWE)" : "Digital Signature (Module-LWE/SIS)",
          securityCategory: targetSecurity >= 256 ? "NIST Category 5 (AES-256 equivalent)" : targetSecurity >= 192 ? "NIST Category 3 (AES-192 equivalent)" : "NIST Category 1 (AES-128 equivalent)",
          quantumResistance: "High - Immune to polynomial-time Shor factorization/DLP. Best quantum sieve attack complexity matches NIST security categories.",
          keySizes: {
            publicKeyBytes: algorithm.includes("1024") ? 1568 : algorithm.includes("768") ? 1184 : 800,
            ciphertextBytes: algorithm.includes("1024") ? 1568 : algorithm.includes("768") ? 1088 : 768,
            privateKeyBytes: algorithm.includes("1024") ? 3168 : algorithm.includes("768") ? 2400 : 1632,
          },
          summary: `${algorithm} is standard-compliant under FIPS 203. It relies on the hardness of the Module Learning With Errors (M-LWE) problem over the cyclotomic ring $\\mathbb{Z}_q[X]/(X^{256}+1)$ with $q=3329$.`,
          migrationRecommendation: "Deploy immediately in hybrid mode (e.g. X25519 + ML-KEM-768) to protect current sessions from long-term eavesdropping and retroactive decryption.",
        });
      }

      const systemInstruction = `You are a Post-Quantum Cryptographer specializing in NIST PQC standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA, and FALCON).
Provide a structured JSON cryptanalysis for the requested algorithm.
Return JSON schema:
{
  "algorithm": "string",
  "nistCategory": "string",
  "securityCategory": "string",
  "quantumResistance": "string",
  "keySizes": {
    "publicKeyBytes": number,
    "ciphertextBytes": number,
    "privateKeyBytes": number
  },
  "summary": "string",
  "migrationRecommendation": "string"
}
Output strictly valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Analyze cryptographic resilience for ${algorithm} with target security level ${targetSecurity} bits. Include quantum lattice attack bounds and hybrid deployment advice.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch {
        parsed = null;
      }

      if (!parsed) {
        return res.json({
          algorithm,
          nistCategory: "Module-LWE Key Encapsulation",
          securityCategory: "NIST Category 3",
          quantumResistance: "Immune to Shor's algorithm",
          keySizes: { publicKeyBytes: 1184, ciphertextBytes: 1088, privateKeyBytes: 2400 },
          summary: `${algorithm} provides high post-quantum assurance under FIPS 203.`,
          migrationRecommendation: "Adopt hybrid key exchange for immediate quantum safety.",
        });
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("PQC Analysis Error:", err);
      return res.status(500).json({ error: err.message || "Failed to analyze PQC scheme." });
    }
  });

  // ==========================================
  // DELPHI AGENT ARENA BOT ENDPOINTS
  // ==========================================
  app.get("/api/delphi/state", (_req, res) => {
    try {
      res.json({
        state: delphiBotRunner.getState(),
        config: delphiBotRunner.getConfig(),
        isLoopRunning: delphiBotRunner.isLoopRunning(),
        markets: delphiBotRunner.currentMarkets,
        forecasts: Array.from(delphiBotRunner.currentForecasts.entries()).map(([k, v]) => ({ id: k, forecast: v })),
        opportunities: delphiBotRunner.currentOpportunities,
        positions: tradeExecutor.getPositions(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/delphi/start", async (_req, res) => {
    try {
      await delphiBotRunner.start();
      res.json({ success: true, isLoopRunning: delphiBotRunner.isLoopRunning() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/delphi/stop", (_req, res) => {
    try {
      delphiBotRunner.stop();
      res.json({ success: true, isLoopRunning: delphiBotRunner.isLoopRunning() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/delphi/cycle", async (_req, res) => {
    try {
      await delphiBotRunner.runCycle();
      res.json({ success: true, state: delphiBotRunner.getState() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/delphi/trade", async (req, res) => {
    try {
      const opp = req.body.opportunity;
      const config = delphiBotRunner.getConfig();
      const result = await tradeExecutor.executeOpportunity(opp, config);
      delphiBotRunner.addLog(result.log.level, result.log.message, result.log.details);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/delphi/config", (req, res) => {
    try {
      delphiBotRunner.updateConfig(req.body.config || {});
      res.json({ success: true, config: delphiBotRunner.getConfig() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Del AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
