import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { text, prompt } = req.body || {};

    if (!text) {
      return res.status(400).json({
        error: "Resume text is required.",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Analysis prompt is required.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${prompt}

Resume Text:
${text}`,
    });

    const content = response.text;

    if (!content) {
      throw new Error("No response received from Gemini.");
    }

    return res.status(200).json({
      reply: content,
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    return res.status(500).json({
      error: error.message || "AI analysis failed.",
    });
  }
}
