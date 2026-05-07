const db = require('./db');
async function fixProperly() {
    try {
        console.log('Starting cleanup...');
        
        // 1. Delete duplicates with NULL business_id, keeping only the earliest one per name
        await db.query(`
            DELETE FROM brands 
            WHERE business_id IS NULL 
            AND id NOT IN (
                SELECT MIN(id) 
                FROM brands 
                WHERE business_id IS NULL 
                GROUP BY name
            )
        `);
        console.log('Duplicates removed.');

        // 2. Map existing NULLs to the correct business_id
        const r = await db.query("UPDATE brands SET business_id = 'biz_blink_001' WHERE business_id IS NULL");
        console.log(`Updated ${r.rowCount} brands to the correct business ID.`);

    } catch (e) {
        console.error('Final Fix Error:', e.message);
    }
    process.exit();
}
fixProperly();
