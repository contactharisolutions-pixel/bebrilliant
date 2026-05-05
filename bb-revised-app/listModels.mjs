import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';

async function run() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        fs.writeFileSync('models.json', JSON.stringify(data, null, 2), 'utf8');
    } catch(e) {
        fs.writeFileSync('models.json', e.message, 'utf8');
    }
}
run();
