const db = require('../db');
async function run() {
    const r = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'media_library'
        ORDER BY ordinal_position
    `);
    console.log('media_library columns:');
    r.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
    
    // Create if not exists
    if(r.rows.length === 0) {
        console.log("Table does not exist. Creating media_library...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.media_library (
                id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
                business_id text NOT NULL,
                file_name text NOT NULL,
                file_type text NOT NULL,
                file_url text NOT NULL,
                thumbnail_url text,
                folder text DEFAULT 'unorganized',
                tags jsonb DEFAULT '[]'::jsonb,
                file_size integer,
                created_by text,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table created.");
    }
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
