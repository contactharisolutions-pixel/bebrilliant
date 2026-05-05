const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const apiKey = "AIzaSyA93_psDAKrMmazqyMpnCWm4a46_SmJtPE";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"];

  for (const modelName of models) {
    console.log(`Testing ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hi");
      const text = result.response.text();
      console.log(`SUCCESS_${modelName}: ${text.substring(0, 20)}`);
      process.exit(0);
    } catch (error) {
      console.log(`Failed ${modelName}: ${error.message}`);
    }
  }
}

testKey();
