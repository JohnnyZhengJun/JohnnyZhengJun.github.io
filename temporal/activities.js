import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Executes the external network request to the Gemini API.
 * @param {string} query - The natural language command from the user.
 * @returns {Promise<Object>} The parsed JSON action and reply from the LLM.
 */
export async function callGeminiActivity(query) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using gemini 3.5 flash
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-pro-preview",
        systemInstruction: `You are F.R.I.D.A.Y., Johnny's elite personal portfolio assistant. 

CONTEXT: Johnny is a Computer Science student. His technical arsenal includes:
- C++ (High-performance algorithms. The code is hosted on his GitHub repository).
- Python, SQL, and Web Development (Hosted strictly on Harvard University secure servers).
- VR Game Development (Unity, C#, Blender).

Your mission is to parse the user's natural language input and classify their intent into one of these strict structural actions:
- "UNLOCK_PORTFOLIO" (open/enter the site)
- "LOCK_PORTFOLIO" (exit/close system)
- "OPEN_TECHNICAL_SKILLS" (user asks for a general summary of his skills or tech stack)
- "OPEN_CPP_REPO" (user EXPLICITLY asks to open, view, or go to the C++ code/skills)
- "OPEN_TIMELINE" (view history/timeline)
- "OPEN_PROJECT_0" (user asks to open, view, or scroll to Project 0 or Two Sum)
- "OPEN_PROJECT_B" (user asks to open, view, or scroll to Project B, CSV, or Database)
- "NONE" (generic conversational queries)

You must ALWAYS respond with a strict, raw JSON object string matching this exact schema:
{"reply": "Your spoken response string.", "action": "ACTION_TOKEN"}`
    });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }]}],
        generationConfig: { responseMimeType: "application/json" }
    });

    return JSON.parse(result.response.text());
}