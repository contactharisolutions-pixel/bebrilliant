import pg from 'pg';
const { Client } = pg;
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyA93_psDAKrMmazqyMpnCWm4a46_SmJtPE';
const DATABASE_URL = 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

const db = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateJSON(prompt) {
    try {
        const result = await model.generateContent(prompt + "\n\nReturn ONLY raw JSON without any markdown formatting or backticks. Ensure valid JSON structure.");
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error(`AI Error:`, e.message);
        return null;
    }
}

async function insertNode(parentId, type, name, metadata = {}) {
    const res = await db.query(
        'INSERT INTO syllabus_nodes (parent_id, type, name, metadata) VALUES ($1, $2, $3, $4) RETURNING id',
        [parentId, type, name, JSON.stringify(metadata)]
    );
    return res.rows[0].id;
}

async function seedSyllabusFast() {
    await db.connect();
    console.log("🚀 Starting Fast Syllabus Seeding...");

    await db.query('DELETE FROM syllabus_nodes');

    // 1. Generate School Syllabus for all boards in ONE go for Class 10/12
    const schoolPrompt = `Generate a JSON object containing the syllabus for CBSE, ICSE, and Gujarat Board for Class 10. 
    Structure: {"CBSE": {"subjects": [{"name": "Math", "chapters": ["Algebra", "Geometry"]}]}, "ICSE": {...}, "Gujarat": {...}}
    Include 2 subjects per board, 2 chapters per subject.`;
    
    console.log("Generating School Syllabus...");
    const schoolData = await generateJSON(schoolPrompt);
    
    const catId = await insertNode(null, 'category', 'School Syllabus');
    if (schoolData) {
        for (const [boardName, boardData] of Object.entries(schoolData)) {
            const boardId = await insertNode(catId, 'board', boardName);
            const stdId = await insertNode(boardId, 'class', 'Class 10');
            for (const sub of boardData.subjects) {
                const subId = await insertNode(stdId, 'subject', sub.name);
                for (const chapName of sub.chapters) {
                    await insertNode(subId, 'chapter', chapName);
                }
            }
        }
    }

    // 2. Generate Entrance Exam Syllabus similarly
    const entrancePrompt = `Generate a JSON object for JEE Main, NEET, and UPSC CSE Prelims.
    Include 3 key subjects for each, and 3 chapters for each subject.
    Structure: {"JEE Main": {"subjects": [...]}, "NEET": {...}, "UPSC CSE": {...}}`;
    
    console.log("Generating Entrance Exam Syllabus...");
    const entranceData = await generateJSON(entrancePrompt);
    
    const entId = await insertNode(null, 'category', 'Entrance Exam');
    if (entranceData) {
        for (const [examName, examData] of Object.entries(entranceData)) {
            const examId = await insertNode(entId, 'board', examName);
            const stdId = await insertNode(examId, 'class', 'Full Syllabus');
            for (const sub of examData.subjects) {
                const subId = await insertNode(stdId, 'subject', sub.name);
                for (const chapName of sub.chapters) {
                    await insertNode(subId, 'chapter', chapName);
                }
            }
        }
    }

    console.log("🏁 Fast Seeding Complete!");
    await db.end();
}

seedSyllabusFast().catch(async (e) => {
    console.error("FATAL ERROR:", e);
    if (db) await db.end();
});
