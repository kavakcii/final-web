const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k");

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Explain how interest rates affect bond prices in one sentence.";
        
        console.log("Sending request to Gemini 1.5 Pro...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Response:", text);
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();