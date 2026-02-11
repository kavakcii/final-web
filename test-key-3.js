const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const key = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
  const genAI = new GoogleGenerativeAI(key);
  // Using a model confirmed to be in the list
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("Success:", response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testKey();
