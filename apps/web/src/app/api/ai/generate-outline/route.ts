import { NextRequest, NextResponse } from "next/server";
import { genAIClient, isGeminiConfigured, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    if (!isGeminiConfigured() || !genAIClient) {
      console.error("Gemini API key missing or model initialization failed");
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const { topic, difficulty, preferences } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const prompt = `
      You are an expert course curriculum designer.
      Create a course outline for a course about "${topic}".
      Target Audience Level: ${difficulty}.
      Preferences: ${JSON.stringify(preferences)}.

      Return a JSON object with the following structure:
      {
        "title": "Course Title",
        "description": "A compelling description of the course.",
        "sections": [
          {
            "title": "Section Title",
            "description": "Brief description of what this section covers."
          }
        ]
      }

      Create between 3 to 6 sections depending on the complexity.
      Ensure the flow is logical and builds up knowledge.
    `;

    const response = await genAIClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let text = response.text || "";
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to generate valid JSON from AI response" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error generating course outline:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
