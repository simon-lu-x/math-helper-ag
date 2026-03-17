const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

const SYSTEM_PROMPT = `你是一个数学课件内容编辑助手。
用户会给你当前的 Markdown 内容（含 LaTeX 数学公式），以及一条自然语言修改指令。
请严格按指令修改，返回完整的更新后 Markdown 内容，不要有任何解释文字、代码块包裹或多余前缀。`;

export async function applyAIEdit(content: string, command: string): Promise<string> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY;
  if (!apiKey) throw new Error('未配置 VITE_QWEN_API_KEY');

  const resp = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `当前内容：\n${content}\n\n修改指令：${command}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI 服务错误 (${resp.status})`);
  }

  const data = await resp.json();
  const result: string = data.choices[0].message.content;

  // 去掉模型可能包裹的 ```markdown ... ``` 代码块
  return result.replace(/^```(?:markdown)?\n?([\s\S]*?)```$/m, '$1').trim();
}
