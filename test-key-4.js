const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  console.log("Starting test...");
  const key = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  try {
    const result = await model.generateContent("Hello");
    const response = await result.response;
    console.log("Success with gemini-flash-latest:", response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testKey();
