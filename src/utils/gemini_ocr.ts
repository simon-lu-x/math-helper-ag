export const performFaithfulOCR = async (imageUrls: string[]): Promise<string> => {
  const prompt = `
    You are a specialized mathematical OCR engine. 
    Your task is to FAITHFULLY restore the content from the provided handwritten image(s).
    
    CRITICAL RULES:
    1. DO NOT paraphrase, "polish", or "improve" the text in any way.
    2. Keep every comma, period, line break, and unique phrasing exactly as written.
    3. Convert all mathematical formulas to standard LaTeX format using $...$ for inline and $$...$$ for display.
    4. For blank fill-in lines (answer blanks), use $\\underline{\\qquad}$ (inside dollar signs so it renders correctly).
    5. Output ONLY the raw Markdown content. No conversational filler or explanations.
    6. Use Markdown headers (#, ##) to represent the hierarchy visible in the notes.
    
    The user is a senior math teacher. They need their notes digitized exactly as they wrote them on paper.
  `;

  try {
    // FIX: Convert Blob URLs to Base64 because the backend proxy can't access client-side Blob memory
    const imagesWithData = await Promise.all(
      imageUrls.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<{ data: string; mimeType: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(",")[1];
            resolve({
              data: base64data,
              mimeType: blob.type,
            });
          };
          reader.readAsDataURL(blob);
        });
      })
    );

    // 生产环境通过 VITE_API_BASE 指向阿里云 FC 触发器地址
    // 开发环境默认走 /api（vite dev proxy → localhost:3001）
    const apiBase = import.meta.env.VITE_API_BASE ?? '/api';
    const response = await fetch(`${apiBase}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imagesWithData, prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error && errorData.error.includes('Missing API Key')) {
        throw new Error("API_KEY_MISSING");
      }
      throw new Error(errorData.error || '识别服务暂时不可用');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("Frontend OCR Error:", error);
    if (error.message === "API_KEY_MISSING") throw error;
    throw new Error("识别失败，请检查网络或代理服务器配置");
  }
};
