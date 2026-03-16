import { GoogleGenerativeAI } from "@google/generative-ai";

// NOTE: In a production app, the API key should never be hardcoded on the client.
// This is for demonstration with a locally configured environment variable.
const GEN_AI = new GoogleGenerativeAI((import.meta.env.VITE_GEMINI_API_KEY || "").trim());

export const performFaithfulOCR = async (imageUrls: string[]): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY || !import.meta.env.VITE_GEMINI_API_KEY.trim()) {
    throw new Error("API_KEY_MISSING");
  }

  const model = GEN_AI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(",")[1];
            resolve({
              inlineData: { data: base64data, mimeType: blob.type },
            });
          };
          reader.readAsDataURL(blob);
        });
      })
    );

    const prompt = `
      You are a specialized mathematical OCR engine.
      Your task is to FAITHFULLY and COMPLETELY restore ALL content from the provided handwritten image(s), from the very first character to the very last.

      CRITICAL RULES:
      1. DO NOT skip, omit, or truncate any part of the content. Transcribe EVERY line, including titles, subtitles, introductory sentences, and ALL numbered questions.
      2. DO NOT paraphrase, "polish", or "improve" the text. Every character, comma, period, and line break must match the original exactly. Pay extra attention to Chinese characters that look similar (e.g., 数/表, 大/太, 已/己).
      3. Convert all mathematical formulas and expressions to standard LaTeX format using $...$ for inline math and $$...$$ for display math.
      4. For blank fill-in lines (answer blanks), use $\\underline{\\qquad}$ (inside dollar signs so it renders correctly).
      5. Output ONLY the raw Markdown content. No conversational filler, no explanations.
      6. Use Markdown headers (#, ##) to represent the section hierarchy visible in the notes (e.g., # 有理数, ## 一 填空).

      DOMAIN CONTEXT (use this to resolve ambiguous characters):
      This is a Chinese middle school mathematics worksheet. Common terms you will encounter include:
      有理数, 整数, 分数, 小数, 负数, 绝对值, 计算, 化简, 证明, 方程, 不等式, 数轴, 相反数, 倒数.
      When a character is visually ambiguous, always prefer the mathematically meaningful term (e.g., "数" over "表", "算" over "筒").

      The user is a senior math teacher. They need their notes digitized exactly as they wrote them on paper.
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("识别失败，请检查网络或 API 配置");
  }
};
