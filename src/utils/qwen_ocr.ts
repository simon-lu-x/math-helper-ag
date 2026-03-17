const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;
const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

// 复用与 gemini_ocr.ts 相同的 prompt，保证对比结果有可比性
const OCR_PROMPT = `
  You are a specialized mathematical OCR engine.
  Your task is to FAITHFULLY restore the content from the provided handwritten image(s).

  CRITICAL RULES:
  1. DO NOT paraphrase, "polish", or "improve" the text in any way.
  2. Keep every comma, period, line break, and unique phrasing exactly as written.
  3. MATH FORMATTING — follow exactly:
     - Wrap EVERY mathematical expression in $$...$$ placed on its OWN separate line.
     - NEVER use single-dollar $...$ inline math — not even for single variables.
     - For variables or short symbols inside a sentence, write them as plain text (e.g. write  x, a, n  without any dollar signs).
     - For absolute values use \\left| ... \\right|.
     - For nested absolute values use \\left| ... \\left| ... \\right| ... \\right|.
  4. For fill-in answer blanks, output exactly: $$\\underline{\\qquad}$$ on its own line.
  5. Output ONLY the raw Markdown content. No conversational filler or explanations.
  6. Use Markdown headers (#, ##) to represent the hierarchy visible in the notes.

  The user is a senior math teacher. They need their notes digitized exactly as they wrote them on paper.
`;

export const performQwenOCR = async (imageUrls: string[]): Promise<string> => {
  if (!QWEN_API_KEY) {
    throw new Error("API_KEY_MISSING");
  }

  // 复用 gemini_ocr.ts 相同的 Blob → Base64 逻辑
  const imagesWithData = await Promise.all(
    imageUrls.map(async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<{ data: string; mimeType: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(",")[1];
          resolve({ data: base64data, mimeType: blob.type });
        };
        reader.readAsDataURL(blob);
      });
    })
  );

  // Qwen-VL 支持多图，格式兼容 OpenAI vision API
  const content: object[] = [
    ...imagesWithData.map(img => ({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    })),
    { type: 'text', text: OCR_PROMPT },
  ];

  try {
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) throw new Error("API_KEY_MISSING");
      throw new Error(errorData.error?.message || '识别服务暂时不可用');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Qwen OCR Error:", error);
    if (error.message === "API_KEY_MISSING") throw error;
    throw new Error("Qwen 识别失败：" + error.message);
  }
};
