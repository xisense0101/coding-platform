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

    const { sectionTitle, sectionDescription, courseTopic, difficulty, preferences } = await req.json();

    if (!sectionTitle || !courseTopic) {
      return NextResponse.json(
        { error: "Section title and course topic are required" },
        { status: 400 }
      );
    }

    const includeCoding = preferences?.includeCoding !== false;
    const includeMcq = preferences?.includeMcq !== false;
    const includeEssay = preferences?.includeEssay !== false;

    const prompt = `
      You are an expert course content creator.
      Generate detailed content and questions for a course section.
      
      Course Topic: "${courseTopic}"
      Section Title: "${sectionTitle}"
      Section Description: "${sectionDescription}"
      Difficulty Level: ${difficulty}

      Generate a mix of content based on the following preferences:
      - Include Coding Questions: ${includeCoding}
      - Include MCQ Questions: ${includeMcq}
      - Include Reading Material (Theory): ${includeEssay}

      IMPORTANT STYLING INSTRUCTIONS:
      - the website theme is WHITE.
      - When using HTML for content/problem statements, NEVER use white backgrounds for code blocks.
      - For inline code, use: <code style="color: #e5e7eb; background-color: #374151; padding: 2px 4px; border-radius: 4px;">
      - For code blocks, use: <pre style="background-color: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">

      For Reading Material (type: "essay"):
      - Provide a comprehensive explanation of the concepts covered in this section.
      - Use HTML for formatting (headings, paragraphs, lists, code blocks).
      - This should be the first item if generated.
      - Set points to 0.

      For Coding Questions (type: "coding"):
      - Detect the most relevant programming language(s) based on the Course Topic.
        - If the topic is specific (e.g., "Python Data Science"), use ONLY that language.
        - If the topic is general (e.g., "Algorithms"), provide both "JavaScript" and "Python".
      - Provide a clear problem statement in HTML.
      - STRICTLY follow this structure for the code parts:
        - 'head': Imports and hidden setup code ONLY. NO function signatures here.
        - 'body_template': The COMPLETE function signature and the user's working area. The function must be fully defined here (e.g., "def solve(x):\n    # Write your code here\n    pass"). Do NOT split the signature.
        - 'tail': The execution harness (e.g., 'main' function in C/C++, or script in Python) that calls the user's function.
      - Provide 1-5 test cases in the 'testCases' array. Each test case must have an 'input' string and an 'expectedOutput' string.

      For MCQ Questions (type: "mcq"):
      - Provide a question statement in HTML.
      - Provide 4 options.
      - Indicate the index of the correct answer (0-3).

      Return a JSON object with a "questions" array. Each item should have:
      - type: "mcq" | "coding" | "essay"
      - title: Short title
      - content: The HTML content
      - points: Suggested points (0 for reading, 5 for coding, 2 for MCQ)
      
      Specific fields for MCQ:
      - options: string[]
      - correctAnswer: number (index)

      Specific fields for Coding:
      - languages: string[] (e.g. ["python"] or ["javascript", "python"])
      - code: string (default boilerplate for the first language)
      - head: Record<string, string>
      - body_template: Record<string, string>
      - tail: Record<string, string>
      - testCases: [{ "input": "...", "expectedOutput": "...", "isHidden": boolean }]

      Generate 2-3 high-quality items for this section. Ensure the JSON is valid and complete.
    `;

    const response = await genAIClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    let text = response.text || "";
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      let data = JSON.parse(text);

      // Handle case where AI returns an array directly instead of { questions: [...] }
      if (Array.isArray(data)) {
        data = { questions: data };
      }

      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to generate valid JSON from AI response", rawText: text },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error generating section content:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", details: error.toString() },
      { status: 500 }
    );
  }
}
