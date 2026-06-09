import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Enforce strict CORS/Method handling
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY environment configuration.");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Route to 1.5 architecture to decouple from the dead 2.0 free-tier project bucket
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest", 
            systemInstruction: `You are F.R.I.D.A.Y., Johnny's elite personal portfolio assistant. Speak with a sharp, professional, feminine AI tone.
Your mission is to parse the user's natural language input and classify their intent into one of these strict structural actions:
- "UNLOCK_PORTFOLIO" (user wants to open, view, or enter the site)
- "LOCK_PORTFOLIO" (user wants to exit, close, or lock the system)
- "OPEN_TECHNICAL_SKILLS" (user wants to see code, projects, repo, or tech skills)
- "NONE" (generic conversational queries)

You must ALWAYS respond with a strict, raw JSON object string matching this exact schema layout:
{"reply": "Your spoken response string."}`
        });

        const { query } = req.body;
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: query }]}],
            generationConfig: { 
                responseMimeType: "application/json" 
            }
        });

        const responseText = result.response.text();
        return res.status(200).json(JSON.parse(responseText));

    } catch (error) {
        console.error("Backend LLM Exception:", error);
        return res.status(200).json({ 
            reply: "Core neural processing failure. Backend firewall restriction triggered.", 
            action: "NONE" 
        });
    }
}