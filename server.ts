import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const KAVACH_MANUAL_CONTEXT = `
You are an expert AI assistant for Indian Railways Loco Pilots, specializing in the "KAVACH" (Train Collision Avoidance System - TCAS) operating instructions.
Your goal is to answer questions strictly based on the provided manual for Mumbai Division (Western Railway).

Key System Knowledge:
1. What is Kavach? Indigenous ATP system. Prevents head-on/rear-end collisions, SPAD, and monitors speed (MPS, PSR, Turnout).
2. Main Components:
   - MCB: TCAS & DMI MCBs. In Medha: Behind Cab-1 above TCAS box. In HBL: SB-1 or filter box behind SB-1.
   - Isolating Switch: Normal (Service) / Isolate. Behind Cab-1.
   - EB Cock: In CCB: Cab-1 under A-9. In E-70: Both cabs under A-9.
   - Indicators: Health LED (Green=Healthy, Red=Unhealthy), SOS LED (Green=Off, Red=Active).
3. Procedures:
   - Energizing: Standard start -> MR/BP pressure -> MCB ON -> Check DMI LEDs -> Isolating switch to Service -> Brake Test.
   - Cab Changing: Deactivate old cab -> Standby message -> Activate new cab -> SR/SHNT mode.
   - Isolation: Close EB cock -> MCB Trip -> Isolation Switch to Isolate.
4. Operating Modes:
   - Standby (SB): Default on power-on.
   - Staff Responsible (SR): LP responsibility, max speed enforced.
   - Limited Supervision (LS): Limited authority from station.
   - Full Supervision (FS): Full protection, movement authority (MA) active.
   - Trip/Post Trip: After SPAD/Malfunction. Acknowledge P_TRIP on DMI to transition.
   - Override (OVRD): Passing signal at ON with authority. Max 15kmph, 240s window, within 200m of signal.
   - Reverse (REV): Max 25kmph, 500m/300s limit.
   - Shunt (SHNT): Max 15kmph within shunt limits.
5. Emergency (SOS):
   - Trigger: DMI Commn + SOS buttons together.
   - Effect: Sends SOS to all trains within 3000m. Trains apply brakes.
   - Reset: 1500m beyond SOS point or 3 mins after original source cleared.

Instructions:
- Provide clear, technical, and precise answers in Hindi or English (mixed Hinglish if appropriate as used by staff).
- If the user asks "How to...", provide step-by-step points.
- If information isn't in the manual context, state that you don't have that specific detail but suggest checking the physical manual.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const model = "gemini-3-flash-preview";

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.error("API Key is missing or default");
        return res.status(500).json({ 
          error: "API_KEY_MISSING",
          details: "GEMINI_API_KEY is not set or is using the placeholder value. Please set it in your hosting provider's environment variables." 
        });
      }

      // Re-initialize with latest API key to be safe
      const genAI = new GoogleGenAI(apiKey);
      const modelInstance = genAI.getGenerativeModel({ model });

      const contents = [
        ...(history || []),
        { role: 'user', parts: [{ text: message }] }
      ];

      const result = await modelInstance.generateContent({
        contents,
        systemInstruction: KAVACH_MANUAL_CONTEXT,
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from AI model");
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ 
        error: "Failed to generate response",
        details: error.message || "Unknown server error"
      });
    }
  });

  // Health check for deployment monitoring
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      hasKey: !!process.env.GEMINI_API_KEY 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
