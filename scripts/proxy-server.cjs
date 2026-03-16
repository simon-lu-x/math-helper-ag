const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
// Increased limit to handle multiple Base64 images
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/api/ocr', async (req, res) => {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
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
    // FIX: Directly use the Base64 data provided by the frontend
    const imageParts = images.map((img) => ({
      inlineData: { 
        data: img.data, 
        mimeType: img.mimeType || 'image/jpeg' 
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = await result.response.text();
    
    res.json({ text: responseText });
  } catch (error) {
    console.error("Proxy OCR Error:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Gemini Proxy Server running at http://localhost:${port}`);
  console.log(`API endpoint ready at http://localhost:${port}/api/ocr`);
});
