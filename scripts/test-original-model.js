const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";

async function testOriginalModel() {
    console.log("Testing 'gemini-flash-latest'...");
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hi");
        console.log("Success with 'gemini-flash-latest'!");
        console.log(result.response.text());
    } catch (e) {
        console.log("Failed 'gemini-flash-latest':", e.message);
    }
}

testOriginalModel();
