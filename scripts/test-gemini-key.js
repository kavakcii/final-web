const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcoded key from .env.local for testing
const API_KEY = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";

async function testGemini() {
    console.log("Testing Gemini API...");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Trying standard model name first

    const prompt = "Explain why the sky is blue in one sentence.";

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        if (error.response) {
            console.error("Error details:", JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
