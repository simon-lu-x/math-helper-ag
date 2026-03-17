/**
 * 阿里云函数计算 FC 3.0 HTTP 触发器
 * 替代 Firebase Cloud Functions 的 OCR 后端
 *
 * 部署方式: Serverless Devs (s deploy) 或控制台上传
 * 入口: lib/fc_index.handler
 */

import * as http from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";

type FCRequest = http.IncomingMessage & { body?: Buffer | string };
type FCResponse = http.ServerResponse;

const setCorsHeaders = (resp: FCResponse) => {
  resp.setHeader("Access-Control-Allow-Origin", "*");
  resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const sendJSON = (resp: FCResponse, status: number, body: object) => {
  resp.setHeader("Content-Type", "application/json");
  resp.statusCode = status;
  resp.end(JSON.stringify(body));
};

const readBody = (req: FCRequest): Promise<string> => {
  // FC 可能已将 body 作为 Buffer 挂载到 req.body
  if (req.body !== undefined) {
    return Promise.resolve(
      Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body)
    );
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
};

export const handler = async (req: FCRequest, resp: FCResponse) => {
  setCorsHeaders(resp);

  // 处理 CORS 预检
  if (req.method === "OPTIONS") {
    resp.statusCode = 204;
    resp.end();
    return;
  }

  if (req.method !== "POST") {
    sendJSON(resp, 405, { error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJSON(resp, 500, {
      error: "Server configuration error: Missing API Key",
    });
    return;
  }

  let body: { images: { data: string; mimeType: string }[]; prompt: string };
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    sendJSON(resp, 400, { error: "Invalid JSON body" });
    return;
  }

  const { images, prompt } = body;
  if (!images || !Array.isArray(images)) {
    sendJSON(resp, 400, { error: "Missing images for OCR" });
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
    sendJSON(resp, 200, { text });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("OCR Error:", msg);
    sendJSON(resp, 500, { error: msg });
  }
};
