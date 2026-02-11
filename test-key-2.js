const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const key = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
  // We can't list models directly with GoogleGenerativeAI client easily without authentication context sometimes, 
  // but let's try a direct fetch if the SDK allows or just try another common model name.
  // Actually, let's try 'gemini-1.5-flash-latest' which was used in the user's code before I changed it.
  
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  
  try {
      const result = await model.generateContent("Hello");
      const response = await result.response;
      console.log("Success with gemini-1.5-flash-latest:", response.text());
  } catch (error) {
      console.error("Error with gemini-1.5-flash-latest:", error.message);
  }
}

listModels();
