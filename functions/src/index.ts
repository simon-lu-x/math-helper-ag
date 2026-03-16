import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiKey = defineSecret("GEMINI_API_KEY");

export const ocr = onRequest(
  { cors: true, timeoutSeconds: 120, memory: "256MiB", secrets: [geminiKey] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const apiKey = geminiKey.value();
    if (!apiKey) {
      res.status(500).json({ error: "Server configuration error: Missing API Key" });
      return;
    }

    const { images, prompt } = req.body as {
      images: { data: string; mimeType: string }[];
      prompt: string;
    };

    if (!images || !Array.isArray(images)) {
      res.status(400).json({ error: "Missing images for OCR" });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
      const imageParts = images.map((img) => ({
        inlineData: { data: img.data, mimeType: img.mimeType || "image/jpeg" },
      }));

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = await result.response.text();
      res.status(200).json({ text });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Internal Server Error";
      console.error("OCR Error:", msg);
      res.status(500).json({ error: msg });
    }
  }
);
