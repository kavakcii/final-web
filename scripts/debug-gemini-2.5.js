const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k");

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = "Explain how interest rates affect bond prices in one sentence.";
        
        console.log("Sending request to Gemini 2.5 Pro...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();