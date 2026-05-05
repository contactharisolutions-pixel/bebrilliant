const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const apiKey = "AIzaSyA93_psDAKrMmazqyMpnCWm4a46_SmJtPE";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Respond with only the word OK");
    console.log("RESULT:" + result.response.text().trim());
  } catch (e) {
    console.log("ERROR:" + e.message);
  }
}
testKey();
