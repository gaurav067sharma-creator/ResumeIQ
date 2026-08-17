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

    let response;
    let lastError;

    // Retry Gemini up to 3 times if the service is temporarily unavailable
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `${prompt}

Resume Text:
${text}`,
        });

        break;
      } catch (error) {
        lastError = error;

        console.log(`Gemini attempt ${attempt} failed.`);

        // Retry only temporary service errors
        if (error.status !== 503 && error.status !== 429) {
          throw error;
        }

        // Don't wait after the final attempt
        if (attempt < 3) {
          const delay = attempt * 2000;
          console.log(`Retrying Gemini in ${delay / 1000} seconds...`);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Gemini did not return a response.");
    }

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
