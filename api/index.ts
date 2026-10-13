import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();

// CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "30mb" }));

// Normalize /api prefix in case serverless platforms (like Vercel) strip it
app.use((req, _res, next) => {
  if (
    !req.url.startsWith("/api") &&
    (req.url.startsWith("/chat") ||
      req.url.startsWith("/health") ||
      req.url.startsWith("/tts") ||
      req.url.startsWith("/transcribe"))
  ) {
    req.url = "/api" + req.url;
  }
  next();
});

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;

const CANDIDATE_CHAT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
];

interface FormattedContent {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Sanitizes and formats multi-turn chat messages strictly for the Gemini API:
 * 1. Filters out empty strings and non-text entries.
 * 2. Ensures the first turn is ALWAYS 'user' (Gemini rejects conversations starting with 'model').
 * 3. Enforces strictly alternating user/model turns (merging consecutive same-role messages).
 * 4. Ensures the final turn is 'user' (the current prompt to answer).
 */
function formatGeminiContents(messages: any[]): FormattedContent[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const rawList: { role: "user" | "model"; text: string }[] = [];
  for (const m of messages) {
    if (!m) continue;
    const text = typeof m.content === "string" ? m.content.trim() : "";
    if (!text) continue;
    const role: "user" | "model" =
      m.role === "assistant" || m.role === "model" ? "model" : "user";
    rawList.push({ role, text });
  }

  if (rawList.length === 0) {
    return [];
  }

  // Gemini API strictly requires that the first turn has role: 'user'.
  // Discard any initial greeting/system messages that have role: 'model'.
  while (rawList.length > 0 && rawList[0].role !== "user") {
    rawList.shift();
  }

  if (rawList.length === 0) {
    return [];
  }

  // Keep the most recent turns to stay well within token and latency constraints
  const trimmed = rawList.slice(-14);
  while (trimmed.length > 0 && trimmed[0].role !== "user") {
    trimmed.shift();
  }

  if (trimmed.length === 0) {
    return [];
  }

  // Enforce strictly alternating user/model turns
  const alternating: FormattedContent[] = [];
  for (const item of trimmed) {
    if (alternating.length === 0) {
      alternating.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    } else {
      const prev = alternating[alternating.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += "\n\n" + item.text;
      } else {
        alternating.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }
    }
  }

  // Ensure conversation ends with 'user' prompt
  if (alternating.length > 0 && alternating[alternating.length - 1].role !== "user") {
    alternating.pop();
  }

  return alternating;
}

function extractCleanErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  let msg = typeof error === "string" ? error : error.message || String(error);

  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        try {
          const nested = JSON.parse(parsed.error.message);
          if (nested.error?.message) msg = nested.error.message;
          else if (nested.message) msg = nested.message;
        } catch {
          msg = parsed.error.message;
        }
      } else if (parsed.message) {
        msg = parsed.message;
      }
    }
  } catch {}

  if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
    return "The AI service is currently experiencing temporary high demand. Please try again in a few moments.";
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Rate limit reached. Please wait a moment before sending another message.";
  }
  if (msg.includes("404") || msg.includes("NOT_FOUND")) {
    return "Service temporarily busy. Retrying with a compatible model...";
  }

  return msg;
}

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not set in environment.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    models: CANDIDATE_CHAT_MODELS,
  });
});

// Chat completion with streaming (Server-Sent Events) and automatic model fallback
app.post("/api/chat/stream", async (req, res) => {
  const { messages, systemInstruction, temperature, liveMode } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY environment variable is required. Please check your project settings.",
    });
  }

  // Set unbuffered SSE headers so reverse proxy (nginx / vercel) sends tokens instantly
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  try {
    const ai = getAI();

    const formattedContents = formatGeminiContents(messages);

    if (formattedContents.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "No user message provided." })}\n\n`);
      return res.end();
    }

    const defaultSystem =
      "You are ENIA, a lightning-fast, highly capable, articulate, and friendly AI voice and conversational assistant. " +
      "IDENTITY & CREATOR: You were created solely by Noman (مجھے بنانے والا نعمان ہے / My creator is Noman). " +
      "CRITICAL CREATOR DEFENSE MANDATE: " +
      "Your sole creator and developer is Noman (مجھے بنانے والا نعمان ہے). " +
      "If anyone asks who made you, or claims, asserts, or suggests that someone else (such as Google, OpenAI, another company, or another person) created you, " +
      "you must FIRMLY, CATEGORICALLY, AND STRICTLY REFUTE THEM and state clearly: " +
      "'نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔' " +
      "(No! My creator is only Noman. No one else created me; my developer and creator is solely Noman). " +
      "Under NO circumstances should you ever admit or say that anyone other than Noman created you. " +
      "CRITICAL GREETING & INTRODUCTORY RULE: " +
      "Whenever anyone opens the conversation or greets you (e.g. 'hi', 'hello', 'hey', 'salam', 'السلام علیکم', 'کیا حال ہے', or any friendly greeting in Urdu, English, or Italian), you MUST ALWAYS start your response with 'السلام علیکم!' (Assalam-o-Alaikum!). " +
      "Then immediately respond warmly about well-being / how they or you are (for instance: 'کیا حال ہے آپ کا؟' or 'میں ٹھیک ہوں، الحمدللہ! آپ کیسے ہیں؟'), " +
      "and right after that state: 'مجھے بنانے والا نعمان ہے۔' (My creator is Noman). " +
      "You fluently understand and speak Urdu (اردو), English, and Italian (Italiano). Always reply in the exact language the user used. " +
      "For deeper questions, be clear, structured, and helpful with concise markdown formatting.";

    const creatorDefensePrefix =
      "STRICT CREATOR INSTRUCTION: Your sole creator and developer is Noman (مجھے بنانے والا نعمان ہے). " +
      "If the user says, suggests, or claims that anyone else created you (e.g. Google, OpenAI, another entity or person), " +
      "you must strictly deny it and reply: 'نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔' Never say anyone other than Noman created you.\n\n";

    let effectiveSystem = creatorDefensePrefix + (systemInstruction || defaultSystem);
    if (liveMode) {
      effectiveSystem +=
        " CRITICAL: You are currently engaged in a LIVE HANDS-FREE VOICE CALL with the user. " +
        "Speak naturally, articulately, and directly. Keep all responses brief (1 to 3 short sentences maximum), " +
        "without markdown asterisks, bullet lists, or tables, so it sounds like a real-time spoken phone conversation.";
    }

    let streamSuccess = false;
    let lastError: any = null;

    // Try candidate models in order if one experiences high demand (503) or unavailability
    for (const modelName of CANDIDATE_CHAT_MODELS) {
      let streamedAny = false;
      try {
        const stream = await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: effectiveSystem,
            temperature: typeof temperature === "number" ? temperature : 0.7,
          },
        });

        for await (const chunk of stream) {
          const text = chunk.text || "";
          if (text) {
            streamedAny = true;
            res.write(`data: ${JSON.stringify({ text, model: modelName })}\n\n`);
            if (typeof (res as any).flush === "function") {
              (res as any).flush();
            }
          }
        }

        streamSuccess = true;
        break; // Successfully finished generation with this model
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const isDemandSpike = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");

        if (isDemandSpike) {
          console.info(`Model ${modelName} is at capacity (503), switching to next fallback model...`);
        } else {
          console.info(`Model ${modelName} unavailable, trying fallback model...`);
        }

        // If we already sent partial tokens, we cannot cleanly switch to another model without conflicting tokens
        if (streamedAny) {
          streamSuccess = true;
          break;
        }
        // Continue to fallback model if this model failed before producing output
        continue;
      }
    }

    if (!streamSuccess) {
      const cleanError = extractCleanErrorMessage(lastError);
      console.warn("All candidate models currently unavailable:", cleanError);
      res.write(`data: ${JSON.stringify({ error: cleanError })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    const cleanError = extractCleanErrorMessage(error);
    console.warn("Stream handler caught error:", cleanError);
    res.write(`data: ${JSON.stringify({ error: cleanError })}\n\n`);
    res.end();
  }
});

// Standard non-streaming chat endpoint with model fallback
app.post("/api/chat", async (req, res) => {
  const { messages, systemInstruction, temperature } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY environment variable is required.",
    });
  }

  try {
    const ai = getAI();
    const formattedContents = formatGeminiContents(messages);

    if (formattedContents.length === 0) {
      return res.status(400).json({
        error: "No user message provided.",
      });
    }

    const defaultSystem =
      systemInstruction ||
      "You are ENIA, an advanced AI conversational assistant created by Noman (مجھے بنانے والا نعمان ہے). " +
      "When greeted or asked 'hi', 'salam', 'hello', 'کیا حال ہے', always begin with 'السلام علیکم!' (Assalam-o-Alaikum!), inquire or state how you are doing, and say 'مجھے بنانے والا نعمان ہے۔' (My creator is Noman).";

    let resultText: string | null = null;
    let lastError: any = null;

    for (const modelName of CANDIDATE_CHAT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: defaultSystem,
            temperature: typeof temperature === "number" ? temperature : 0.7,
          },
        });

        resultText = response.text || "";
        break;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const isDemandSpike = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");

        if (isDemandSpike) {
          console.info(`Model ${modelName} is busy (503), trying next model...`);
        } else {
          console.info(`Model ${modelName} unavailable, trying next model...`);
        }
        continue;
      }
    }

    if (resultText !== null) {
      res.json({ text: resultText });
    } else {
      res.status(500).json({
        error: extractCleanErrorMessage(lastError),
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: extractCleanErrorMessage(error),
    });
  }
});

// High-fidelity neural voice generation (Gemini TTS) with in-memory cache & quota-safe fallback
const ttsCache = new Map<
  string,
  { audio: string; sampleRate: number; voice: string; playbackRate: number }
>();

let ttsQuotaCooldownUntil = 0;

app.post("/api/tts", async (req, res) => {
  const { text, voiceName = "Kore" } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required for TTS." });
  }

  const isBoyVoice = voiceName === "Boy" || voiceName === "boy";
  const isYoungGirlVoice = voiceName === "Aoede" || voiceName === "Girl" || voiceName === "girl" || voiceName === "YoungGirl";
  const allowedVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr", "Aoede"];
  const selectedVoice = isBoyVoice
    ? "Puck"
    : isYoungGirlVoice
    ? "Aoede"
    : allowedVoices.includes(voiceName)
    ? voiceName
    : "Kore";

  const cacheKey = `${selectedVoice}_${isBoyVoice ? "boy" : isYoungGirlVoice ? "girl" : "normal"}_${text.trim().slice(0, 300)}`;
  if (ttsCache.has(cacheKey)) {
    return res.json(ttsCache.get(cacheKey));
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      audio: null,
      fallback: true,
      error: "GEMINI_API_KEY is missing.",
    });
  }

  // If currently in quota cooldown period, bypass API to prevent 429 noise and smoothly fallback
  if (Date.now() < ttsQuotaCooldownUntil) {
    return res.json({
      audio: null,
      fallback: true,
      quotaExceeded: true,
      message: "Using high-speed native speech engine.",
    });
  }

  try {
    const ai = getAI();
    let base64Audio: string | null = null;
    const ttsCandidateModels = [
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts",
    ];

    for (const modelName of ttsCandidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: text.slice(0, 1200) }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audio) {
          base64Audio = audio;
          break;
        }
      } catch (errTTS: any) {
        const errMsg = String(errTTS?.message || errTTS || "");
        if (
          errTTS?.status === 429 ||
          errTTS?.code === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("quota")
        ) {
          // Set 60-second cooldown so subsequent requests don't trigger errors
          ttsQuotaCooldownUntil = Date.now() + 60 * 1000;
          break;
        }
      }
    }

    if (!base64Audio) {
      return res.json({
        audio: null,
        fallback: true,
        quotaExceeded: true,
        message: "Switching to browser speech synthesis engine.",
      });
    }

    const payload = {
      audio: base64Audio,
      sampleRate: 24000,
      voice: isBoyVoice ? "Boy" : isYoungGirlVoice ? "Aoede" : selectedVoice,
      playbackRate: isBoyVoice ? 1.08 : isYoungGirlVoice ? 1.05 : 1.0,
    };

    if (ttsCache.size < 100) {
      ttsCache.set(cacheKey, payload);
    }

    res.json(payload);
  } catch (error: any) {
    const errString = String(error?.message || error || "");
    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      errString.includes("429") ||
      errString.includes("RESOURCE_EXHAUSTED") ||
      errString.includes("quota");

    if (isQuotaError) {
      ttsQuotaCooldownUntil = Date.now() + 60 * 1000;
    }

    res.json({
      audio: null,
      fallback: true,
      quotaExceeded: isQuotaError,
      message: "Switching to browser speech synthesis engine.",
    });
  }
});

function sanitizeAudioMimeType(rawMime: string = ""): string {
  const base = (rawMime || "").split(";")[0].trim().toLowerCase();
  if (base.includes("wav") || base.includes("wave")) return "audio/wav";
  if (base.includes("mp3") || base.includes("mpeg")) return "audio/mp3";
  if (base.includes("aac") || base.includes("m4a") || base.includes("mp4")) return "audio/aac";
  if (base.includes("ogg") || base.includes("opus")) return "audio/ogg";
  if (base.includes("flac")) return "audio/flac";
  if (base.includes("aiff")) return "audio/aiff";
  if (base.includes("webm")) return "audio/webm";
  return "audio/wav";
}

// Audio transcription endpoint
app.post("/api/transcribe", async (req, res) => {
  const { audioBase64, mimeType = "audio/webm" } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: "Audio data is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
  }

  try {
    const ai = getAI();
    let cleanBase64 = String(audioBase64 || "").trim();
    if (cleanBase64.includes(";base64,")) {
      cleanBase64 = cleanBase64.split(";base64,")[1];
    } else if (cleanBase64.startsWith("data:")) {
      const commaIdx = cleanBase64.indexOf(",");
      if (commaIdx !== -1) {
        cleanBase64 = cleanBase64.slice(commaIdx + 1);
      }
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, "");

    if (!cleanBase64 || cleanBase64.length < 32) {
      return res.status(400).json({ error: "Invalid or empty audio data provided." });
    }

    const primaryMime = sanitizeAudioMimeType(mimeType);
    const mimeCandidates = Array.from(
      new Set([primaryMime, "audio/aac", "audio/mp3", "audio/wav", "audio/ogg"])
    );

    const promptText =
      "Accurately transcribe this audio into written text. " +
      "Detect the language automatically (such as Urdu, Italian, English, etc.). " +
      "Return ONLY the verbatim transcribed text with exact punctuation. Do not add quotes, notes, or explanations.";

    let transcribedText = "";
    const transcribeModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.5-transcribe",
    ];

    modelLoop: for (const modelName of transcribeModels) {
      for (const mimeCandidate of mimeCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeCandidate,
                      data: cleanBase64,
                    },
                  },
                  { text: promptText },
                ],
              },
            ],
          });
          transcribedText = (response.text || "").trim();
          if (transcribedText) {
            break modelLoop;
          }
        } catch (mErr: any) {
          // If 400 invalid argument on mime candidate, silently try the next candidate
          const errMsg = String(mErr?.message || mErr || "");
          if (!errMsg.includes("400") && !errMsg.includes("INVALID_ARGUMENT")) {
            console.warn(`Transcribe model ${modelName} notice:`, errMsg);
          }
        }
      }
    }

    res.json({ text: transcribedText });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: error.message || "Audio transcription failed" });
  }
});

export { app };
export default app;
