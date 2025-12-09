import { NextRequest, NextResponse } from "next/server";
import { genAIClient, isGeminiConfigured, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    if (!isGeminiConfigured() || !genAIClient) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const { topic, difficulty, sectionTitle, questionType, count } = await req.json();

    const prompt = `
      You are an expert exam content creator.
      Generate ${count} ${questionType === 'mcq' ? 'Multiple Choice' : 'Coding'} questions for an exam section.

      Exam Topic: "${topic}"
      Section Title: "${sectionTitle}"
      Difficulty Level: ${difficulty}
      Question Type: ${questionType}
      Number of Questions: ${count}

      IMPORTANT STYLING INSTRUCTIONS:
      - The website theme is WHITE.
      - When using HTML for content/problem statements, NEVER use white backgrounds for code blocks.
      - For inline code, use: <code style="color: #e5e7eb; background-color: #374151; padding: 2px 4px; border-radius: 4px;">
      - For code blocks, use: <pre style="background-color: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">

      ${questionType === 'coding' ? `
      For Coding Questions:
      - Detect the most relevant programming language(s) based on the Topic.
      - Provide a clear problem statement in HTML.
      - STRICTLY follow this structure for the code parts:
        - 'head': Imports and hidden setup code ONLY. NO function signatures here.
        - 'body_template': The COMPLETE function signature and the user's working area. The function must be fully defined here (e.g., "def solve(x):\n    # Write your code here\n    pass"). Do NOT split the signature.
        - 'tail': The execution harness (e.g., 'main' function in C/C++, or script in Python) that calls the user's function.
      - Provide 5 test cases in the 'testCases' array. Each test case must have an 'input' string and an 'expectedOutput' string.
      ` : `
      For MCQ Questions:
      - Provide a question statement in HTML.
      - Provide 4 options. IMPORTANT: The options must be PLAIN TEXT strings. Do NOT use HTML tags or styling in the options.
      - Indicate the index of the correct answer (0-3).
      `}

      Return a JSON object with a "questions" array. Each item should have:
      - type: "${questionType}"
      - title: Short title
      - content: The HTML content
      - points: ${questionType === 'coding' ? 10 : 2}
      
      ${questionType === 'mcq' ? `
      - options: string[]
      - correctAnswer: number (index)
      ` : `
      - languages: string[] (e.g. ["python"] or ["javascript", "python"])
      - code: string (default boilerplate for the first language)
      - head: Record<string, string>
      - body_template: Record<string, string>
      - tail: Record<string, string>
      - testCases: [{ "input": "...", "expectedOutput": "...", "isHidden": boolean }]
      `}

      Ensure the JSON is valid and strictly follows the schema.
    `;

    const response = await genAIClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    const text = response.text || "";
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating exam section:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
