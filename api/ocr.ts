import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  // 1. Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get API Key from Environment Variable (Secure)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const { images, prompt } = req.body;
  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Missing images for OCR' });
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const imageParts = images.map((img: { data: string; mimeType: string }) => ({
      inlineData: { data: img.data, mimeType: img.mimeType || 'image/jpeg' },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = await result.response.text();
    
    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("Proxy OCR Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
