const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcoded key from .env.local for testing
const API_KEY = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";

async function listModels() {
    console.log("Listing available models...");
    // Unfortunately, the SDK doesn't expose listModels directly easily on the instance in all versions, 
    // but we can try a known stable model like 'gemini-pro'.
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try gemini-pro first
    console.log("Trying 'gemini-pro'...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hi");
        console.log("Success with 'gemini-pro'!");
        return;
    } catch (e) {
        console.log("Failed 'gemini-pro':", e.message);
    }

    // Try gemini-1.5-flash
    console.log("Trying 'gemini-1.5-flash'...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with 'gemini-1.5-flash'!");
        return;
    } catch (e) {
        console.log("Failed 'gemini-1.5-flash':", e.message);
    }
    
     // Try gemini-2.0-flash-exp (newer)
    console.log("Trying 'gemini-2.0-flash-exp'...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Hi");
        console.log("Success with 'gemini-2.0-flash-exp'!");
        return;
    } catch (e) {
        console.log("Failed 'gemini-2.0-flash-exp':", e.message);
    }
}

listModels();
