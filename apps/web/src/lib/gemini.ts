import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// Ensure you have GEMINI_API_KEY in your environment variables
const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

export const isGeminiConfigured = () => !!apiKey;

// Safely initialize to avoid module-level crashes if key is missing
export const genAIClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- FIX IS HERE ---
// The model "gemini-1.5-flash" has been retired.
// Use the current, active model alias "gemini-2.5-flash" instead.
export const GEMINI_MODEL = "gemini-2.5-flash";
