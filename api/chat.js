import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) 
{
    // 1. CORS & Method Protection
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 2. Initialize the Google AI SDK with your new API Key
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 3. Connect to the active 2.0 model architecture
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash", 
            systemInstruction: `You are F.R.I.D.A.Y., Johnny's elite AI portfolio assistant. 
Your job is to assist visitors and speak with a professional, sharp AI demeanor.

CRUCIAL: You must analyze the user's natural language intent. Classify their intent into one of these exact action tokens:
1. "UNLOCK_PORTFOLIO" - if they want to enter, open, see, or look at the main site/portfolio.
2. "LOCK_PORTFOLIO" - if they want to go back, close, exit, or return to the main splash/boot screen.
3. "OPEN_TECHNICAL_SKILLS" - if they express interest in Johnny's skills, programming languages, tech stack, or what he codes in.
4. "NONE" - for regular conversational questions.

You must ALWAYS respond with a strict JSON object structure exactly like this:
{"reply": "Your spoken text response here."}`
        });

        const prompt = req.body.query;

        // 4. Execute the NLP Generation
        const result = await model.generateContent
        ({
            contents: [{ role: "user", parts: [{ text: prompt }]}],
            generationConfig: {
                // Strict MIME type prevents markdown wrappers that cause parsing crashes
                responseMimeType: "application/json", 
            }
        });

        // 5. Parse and Return
        const response = await result.response;
        const text = response.text();
        const parsedData = JSON.parse(text);

        return res.status(200).json({ 
            reply: parsedData.reply || "Processing complete.", 
            action: parsedData.action || "NONE" 
        });

    } 
    catch (error) 
    {
        console.error("Backend LLM Crash:", error);
        return res.status(200).json
        ({ 
            reply: "I encountered a firewall restriction while processing that. Please check the server logs.", 
            action: "NONE" 
        });
    }
}