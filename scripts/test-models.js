const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k");

async function listModels() {
    try {
        console.log("Listing models...");
        // There isn't a direct listModels method in the high-level SDK easily accessible without setup,
        // but we can try a known older model like 'gemini-pro' to see if it works.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro works:", await result.response.text());
    } catch (error) {
        console.log("gemini-pro failed:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash-latest works:", await result.response.text());
    } catch (error) {
        console.log("gemini-1.5-flash-latest failed:", error.message);
    }
}

listModels();