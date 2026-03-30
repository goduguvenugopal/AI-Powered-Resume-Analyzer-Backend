import Groq from "groq-sdk";
import makeError from "../middlewares/makeError";
import { config } from "../config/env";

const LLM_MODEL = config.llm_model;

const client = new Groq({ apiKey: config.groq_api_key });

export const analyzeResumeWithGroq = async (
  resumeText: string,
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
}> => {
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
    const result = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    raw = result.choices[0].message.content!.trim();
  } catch (error: any) {
    console.error(
      "Groq raw error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
    if (error?.status === 429) {
      throw makeError(
        "You've reached your analysis limit. Please try again later.",
        429,
      );
    }
    throw makeError("AI analysis failed. Please try again later.", 503);
  }

  // Strip markdown code fences if model adds them despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw makeError("Failed to parse AI response. Please try again.", 502);
  }
};

export { LLM_MODEL };
