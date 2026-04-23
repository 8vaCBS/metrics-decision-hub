import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: 'hello',
      config: { tools: [{ googleSearch: {} }] }
    });
    console.log(res.text);
  } catch (e) { console.error('ERROR', e); }
}
run();
