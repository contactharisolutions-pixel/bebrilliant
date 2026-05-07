const db = require('./db');
const BIZ = 'biz_blink_001';

async function cleanupAndFix() {
    try {
        const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors'];
        
        for (const t of TABLES) {
            console.log(`Fixing table ${t}...`);
            
            // 1. Delete rows with NULL business_id that ALREADY exist for BIZ (same name)
            await db.query(`
                DELETE FROM ${t} 
                WHERE business_id IS NULL 
                AND name IN (SELECT name FROM ${t} WHERE business_id = $1)
            `, [BIZ]);

            // 2. For remaining NULLs, if there are duplicates among NULLs, keep only one per name
            await db.query(`
                DELETE FROM ${t}
                WHERE business_id IS NULL
                AND id NOT IN (SELECT MIN(id) FROM ${t} WHERE business_id IS NULL GROUP BY name)
            `);

            // 3. Update all remaining NULLs to BIZ
            const r = await db.query(`UPDATE ${t} SET business_id = $1 WHERE business_id = 'default' OR business_id IS NULL`, [BIZ]);
            console.log(`${t}: Updated ${r.rowCount} rows`);
        }
    } catch (e) {
        console.error('Cleanup Error:', e.message);
    }
    process.exit();
}
cleanupAndFix();
