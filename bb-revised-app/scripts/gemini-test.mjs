import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyA93_psDAKrMmazqyMpnCWm4a46_SmJtPE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
    try {
        // The listModels method might not exist in this version of the SDK or key permissions
        // Let's just try gemini-1.5-flash and gemini-1.5-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-flash");
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }
}

listModels();
