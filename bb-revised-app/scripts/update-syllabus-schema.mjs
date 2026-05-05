import pg from 'pg';
const { Client } = pg;

const db = new Client({
    connectionString: 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await db.connect();
    console.log("Updating syllabus_nodes constraint...");
    await db.query(`
        ALTER TABLE syllabus_nodes DROP CONSTRAINT IF EXISTS syllabus_nodes_type_check;
        ALTER TABLE syllabus_nodes ADD CONSTRAINT syllabus_nodes_type_check 
        CHECK (type IN ('category', 'board', 'exam', 'class', 'stream', 'subject', 'chapter', 'topic'));
    `);
    console.log("Constraint updated.");
    await db.end();
}

run().catch(console.error);
