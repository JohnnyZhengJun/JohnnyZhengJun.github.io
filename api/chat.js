export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'No query provided' });
    }

    // Securely pull the API key from Vercel's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    // The System Prompt: This tells the AI who it is and how to behave.
    const systemInstruction = `You are a highly efficient, JARVIS-like AI assistant embedded in the personal portfolio of Johnny, a Senior Computer Science Engineering student. 
    Johnny specializes in low-level systems programming (C++, C, memory alignment) and algorithm optimization.
    Keep your answers extremely concise, professional, and slightly futuristic. Do not use markdown or emojis, as your text will be read aloud by a text-to-speech engine.`;

    try {
        // Ping the Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{
                    role: "user",
                    parts: [{ text: query }]
                }]
            })
        });

        const data = await response.json();

        // Extract the actual text reply from the Gemini JSON structure
        const aiText = data.candidates[0].content.parts[0].text;

        // Send it back to the frontend
        return res.status(200).json({ reply: aiText });

    } catch (error) {
        console.error("LLM Error:", error);
        return res.status(500).json({ error: 'Neural net connection failed.' });
    }
}