const db = require('./db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('--- CMS Schema Migration Starting ---');
    
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'cms_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon but be careful with JSON/strings
        // For simplicity, we'll run the whole block if possible, or split by a specific marker
        // Since it's a new migration, running the whole block is usually fine in PG
        await db.query(sql);
        console.log('✅ CMS Tables created successfully.');
        
        // Seed initial homepage if not exists
        const homeCheck = await db.query("SELECT id FROM pages WHERE slug = 'home'");
        if (homeCheck.rows.length === 0) {
            console.log('Seeding initial homepage entry...');
            const pageId = 'pg_home_' + Date.now().toString(36);
            await db.query(`
                INSERT INTO pages (id, page_name, slug, page_type, status) 
                VALUES ($1, $2, $3, $4, $5)
            `, [pageId, 'Homepage', 'home', 'home', 'published']);
            
            await db.query(`
                INSERT INTO page_seo (page_id, seo_title, seo_description) 
                VALUES ($1, $2, $3)
            `, [pageId, 'Blink Opticals | Premium Eyewear', 'Discover luxury frames and vision care at Blink Opticals.']);
        }

    } catch (e) {
        console.error('❌ Migration failed:', e.message);
    }
    
    console.log('--- CMS Migration Complete ---');
    process.exit();
}

migrate();
