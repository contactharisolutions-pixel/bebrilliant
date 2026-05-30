import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Try models
const apiKey = "AIzaSyB6MxW-dfjVgy-5RQDdcbTT5BPCc3Zko5s";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        return `OK: ${modelName}`;
    } catch (e) {
        return `FAIL: ${modelName} - ${e.message.substring(0, 150).replace(/\n/g, ' ')}`;
    }
}

async function run() {
    const logs = [];
    logs.push(await testModel("gemini-2.0-flash"));
    logs.push(await testModel("gemini-2.5-flash"));
    logs.push(await testModel("gemini-flash-latest"));
    logs.push(await testModel("gemini-3-flash-preview"));
    logs.push(await testModel("gemini-1.5-flash"));
    console.log(logs.join('\n'));
}

run();
