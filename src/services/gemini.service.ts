import { GoogleGenerativeAI } from "@google/generative-ai";
import makeError from "../middlewares/makeError";
import { config } from "../config/env";

const LLM_MODEL = "gemini-2.0-flash";

export const analyzeResumeWithGemini = async (
  resumeText: string,
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
}> => {
  const genAI = new GoogleGenerativeAI(config.gemini_api_key);
  const model = genAI.getGenerativeModel({ model: LLM_MODEL });

  const prompt = `
You are an expert resume reviewer. Analyze the following resume and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

The JSON must follow this exact shape:
{
  "summary": "string — 2-3 sentence overall assessment",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "suggestions": ["string", "string", "string"],
  "score": number between 0 and 100
}

Resume:
${resumeText}
  `.trim();

  let raw: string;
  try {
    const result = await model.generateContent(prompt);
    raw = result.response.text().trim();
  } catch {
    throw makeError("Gemini API call failed. Please try again later.", 503);
  }

  // Strip markdown code fences if Gemini adds them despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw makeError("Failed to parse Gemini response. Please try again.", 502);
  }
};

export { LLM_MODEL };
