import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        return `OK: ${modelName}`;
    } catch (e) {
        return `FAIL: ${modelName} - ${e.message.substring(0, 50)}`;
    }
}

async function run() {
    const logs = [];
    logs.push(await testModel("gemini-flash-latest"));
    logs.push(await testModel("gemini-2.5-flash"));
    logs.push(await testModel("gemini-3-flash-preview"));
    console.log(logs.join('\n'));
}

run();
