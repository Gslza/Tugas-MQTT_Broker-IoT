import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini to prevent crash at load time if key is not configured yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Fallback Indonesian Voice Command Rule-Based Engine
function regexInference(command: string) {
  const norm = command.toLowerCase();
  
  let relayNum: number | null = null;
  let value: boolean | null = null;
  let action: string = "UNKNOWN";
  let speechResponse = "Maaf, saya tidak mengerti perintah tersebut. Coba sebutkan seperti 'hidupkan lampu satu'.";

  const onKeywords = ["hidupkan", "nyalakan", "aktifkan", "on", "buka", "nyala"];
  const offKeywords = ["matikan", "nonaktifkan", "off", "tutup", "mati"];

  const isOn = onKeywords.some(kw => norm.includes(kw));
  const isOff = offKeywords.some(kw => norm.includes(kw));

  // Identify Relay
  if (norm.includes("1") || norm.includes("satu") || norm.includes("ruang tamu") || norm.includes("utama")) {
    relayNum = 1;
  } else if (norm.includes("2") || norm.includes("dua") || norm.includes("kamar") || norm.includes("tidur")) {
    relayNum = 2;
  } else if (norm.includes("3") || norm.includes("tiga") || norm.includes("kipas") || norm.includes("fan")) {
    relayNum = 3;
  } else if (norm.includes("4") || norm.includes("empat") || norm.includes("pompa") || norm.includes("ac")) {
    relayNum = 4;
  }

  if (isOn && relayNum) {
    value = true;
    action = "TOGGLE_RELAY";
    speechResponse = `Siap, mendeteksi perintah untuk menyalakan Relay ${relayNum}.`;
  } else if (isOff && relayNum) {
    value = false;
    action = "TOGGLE_RELAY";
    speechResponse = `Siap, mendeteksi perintah untuk mematikan Relay ${relayNum}.`;
  } else if (norm.includes("semua") || norm.includes("all")) {
    action = "SET_ALL_RELAYS";
    if (isOn) {
      value = true;
      speechResponse = "Siap, menyalakan semua perangkat relay sekarang.";
    } else if (isOff) {
      value = false;
      speechResponse = "Siap, mematikan seluruh saluran relay sekarang.";
    }
  } else if (norm.includes("suhu") || norm.includes("temperatur")) {
    action = "GET_STATUS";
    speechResponse = "Tentu! Saya akan menunjukkan pemantauan suhu terbaru dari sensor dht22.";
  } else if (norm.includes("kelembapan") || norm.includes("udara") || norm.includes("humid")) {
    action = "GET_STATUS";
    speechResponse = "Saya akan membukakan tingkat kelembapan udara ruangan untuk Anda.";
  }

  return { action, relayNumber: relayNum, value, speechResponse };
}

// REST API for checking voice commands
app.post("/api/command", async (req: Request, res: Response) => {
  const { command, currentStatus } = req.body;
  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "Missing command statement" });
    return;
  }

  console.log(`[Voice Command Received]: "${command}"`);

  const client = getGeminiClient();
  if (!client) {
    console.warn("GEMINI_API_KEY is not defined. Using regex-based Indonesia voice inference fallback.");
    const fallbackResult = regexInference(command);
    res.json(fallbackResult);
    return;
  }

  try {
    const statusCtx = currentStatus 
      ? `State perangkat saat ini:
- Suhu saat ini: ${currentStatus.suhu || "N/A"}°C
- Kelembapan: ${currentStatus.kelembapan || "N/A"}%
- Relay 1: ${currentStatus.relay1 ? "ON/Menyala" : "OFF/Mati"} (Label: ${currentStatus.relay1Name || "Relay 1"})
- Relay 2: ${currentStatus.relay2 ? "ON/Menyala" : "OFF/Mati"} (Label: ${currentStatus.relay2Name || "Relay 2"})
- Relay 3: ${currentStatus.relay3 ? "ON/Menyala" : "OFF/Mati"} (Label: ${currentStatus.relay3Name || "Relay 3"})
- Relay 4: ${currentStatus.relay4 ? "ON/Menyala" : "OFF/Mati"} (Label: ${currentStatus.relay4Name || "Relay 4"})`
      : "Status perangkat saat ini tidak diketahui.";

    const systemInstruction = `Anda adalah assisten suara pintar premium untuk IoT Smart Home. 
Tugas Anda adalah menafsirkan suara pengguna dalam Bahasa Indonesia untuk mengoperasikan 4 Relay dan memeriksa sensor cuaca/suhu ruangan.

Aturan Pemrosesan:
1. "action" bernilai "TOGGLE_RELAY" untuk menghidupkan/mematikan satu relay.
2. "action" bernilai "SET_ALL_RELAYS" untuk menyalakan/mematikan semua relay sekaligus.
3. "action" bernilai "GET_STATUS" jika menanyakan kondisi sensor (seperti: "bagaimana suhu ruang tidur?", "berapa kelembapannya?").
4. "action" bernilai "UNKNOWN" jika perintah di luar pengoperasian hardware.
5. "relayNumber" adalah nomor relay (1, 2, 3, atau 4) yang terdeteksi, atau null jika tidak berlaku.
6. "value" adalah boolean true jika perintah menyalakan/menghidupkan, false jika mendeaktifkan/mematikan, atau null jika tidak berlaku.
7. "speechResponse" adalah respon audio/teks gaul tapi sopan dalam bahasa Indonesia yang akan dibacakan untuk pengguna. Contoh: "Baik, saya nyalakan lampu ruang tamu sekarang!"

${statusCtx}

PENTING: Selalu mengembalikan output HANYA dengan skema JSON yang valid tanpa markdown extra block.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Proses perintah suara berikut: "${command}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["action", "relayNumber", "value", "speechResponse"],
          properties: {
            action: {
              type: Type.STRING,
              enum: ["TOGGLE_RELAY", "SET_ALL_RELAYS", "GET_STATUS", "UNKNOWN"],
              description: "Tipe aksi IoT yang ditafsirkan.",
            },
            relayNumber: {
              type: Type.INTEGER,
              description: "Nomor relay 1 sampai 4, atau null.",
              nullable: true,
            },
            value: {
              type: Type.BOOLEAN,
              description: "Kondisi relay true atau false.",
              nullable: true,
            },
            speechResponse: {
              type: Type.STRING,
              description: "Jawaban lisan dalam Bahasa Indonesia bernada membantu.",
            },
          },
        },
      },
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText.trim());
    res.json(resultJson);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    // Safe fallback to regex-based inference if Gemini fails for any format or network issues
    const fallbackResult = regexInference(command);
    res.json(fallbackResult);
  }
});

// Setup Server Environment and Vite Midleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server IoT Smart Home running on http://localhost:${PORT}`);
  });
}

startServer();
