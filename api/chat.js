import { GoogleGenerativeAI } from '@google/generative-ai';
export default async function handler(req, res) {
    // CORS & Method checking
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const query = req.body.query.toLowerCase().trim();
        let targetAction = "NONE";
        let spokenReply = "I am processing your request, Johnny.";

        // --- LOCAL NLP OVERRIDE ENGINE ---
        
        // 1. Unlock Portfolio
        if (query.includes('open') || query.includes('access') || query.includes('show portfolio')) {
            targetAction = "UNLOCK_PORTFOLIO";
            spokenReply = "Access granted. Initializing portfolio display protocol.";
        } 
        // 2. Open Technical Skills
        else if (query.includes('skill') || query.includes('language') || query.includes('code') || query.includes('tech')) {
            targetAction = "OPEN_TECHNICAL_SKILLS";
            spokenReply = "Accessing Technical Skills repository now.";
        } 
        // 3. Lock System
        else if (query.includes('back') || query.includes('lock') || query.includes('close') || query.includes('main page')) {
            targetAction = "LOCK_PORTFOLIO";
            spokenReply = "Securing database modules. Returning to system initialization screen.";
        } 
        // 4. Conversational Fallback
        else {
            spokenReply = "My advanced conversational nodes are currently resting to conserve server quota, but my local navigation protocols are fully operational.";
        }

        // Simulate a slight AI thinking delay so your 3D sphere turns purple for a moment
        await new Promise(resolve => setTimeout(resolve, 800));

        // Return the perfect JSON format our frontend expects
        return res.status(200).json({ 
            reply: spokenReply, 
            action: targetAction 
        });

    } catch (error) {
        console.error("Local Routing Error:", error);
        return res.status(200).json({ 
            reply: "Local server routing error.", 
            action: "NONE" 
        });
    }
}