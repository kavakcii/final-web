const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testSpecificModels() {
    const modelsToTry = [
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro"
    ];

    for (const modelName of modelsToTry) {
        console.log(`\nTesting '${modelName}'...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`SUCCESS with '${modelName}'!`);
            console.log(result.response.text());
        } catch (e) {
            console.log(`FAILED '${modelName}':`, e.message);
            if (e.message.includes("429")) {
                console.log("-> Quota exceeded for this one too.");
            }
        }
    }
}

testSpecificModels();
