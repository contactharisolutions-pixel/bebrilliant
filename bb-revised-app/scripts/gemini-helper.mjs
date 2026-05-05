import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateSyllabusBatch(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}
