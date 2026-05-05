import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

const db = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function insertNode(parentId, type, name) {
    const res = await db.query(
        'INSERT INTO syllabus_nodes (parent_id, type, name) VALUES ($1, $2, $3) RETURNING id',
        [parentId, type, name]
    );
    return res.rows[0].id;
}

async function run() {
    await db.connect();
    console.log("Seeding basic structure...");
    
    // Clear
    await db.query('DELETE FROM syllabus_nodes');

    const sId = await insertNode(null, 'category', 'School Syllabus');
    await insertNode(sId, 'board', 'CBSE Board');
    await insertNode(sId, 'board', 'ICSE Board');
    await insertNode(sId, 'board', 'Gujarat Board (English Medium)');
    await insertNode(sId, 'board', 'Gujarat Board (Gujarati Medium)');

    const eId = await insertNode(null, 'category', 'Entrance Exam');
    await insertNode(eId, 'board', 'JEE Main');
    await insertNode(eId, 'board', 'NEET');
    await insertNode(eId, 'board', 'CLAT');

    const cId = await insertNode(null, 'category', 'Competitive Exam');
    await insertNode(cId, 'board', 'UPSC CSE');
    await insertNode(cId, 'board', 'SSC CGL');
    await insertNode(cId, 'board', 'SBI PO');

    console.log("Basic structure seeded.");
    await db.end();
}

run().catch(console.error);
