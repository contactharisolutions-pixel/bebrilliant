const db = require('./db');
async function migrate() {
    console.log('Starting product schema migration...');
    const queries = [
        // Add new columns to product table
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS model_no VARCHAR(100)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS mrp DECIMAL(12,2)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS selling_price DECIMAL(12,2)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_h VARCHAR(50)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_w VARCHAR(50)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_l VARCHAR(50) DEFAULT '140'`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS short_description TEXT`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS tags TEXT[]`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_keywords TEXT`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_description TEXT`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS video_url TEXT`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS main_image TEXT`,
        
        // Add lens info if not exists
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_material_id VARCHAR(50)`,
        `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_color_id VARCHAR(50)`,
        
        // Update variant if needed
        `ALTER TABLE variant ADD COLUMN IF NOT EXISTS color_code VARCHAR(50)`,
        `ALTER TABLE variant ADD COLUMN IF NOT EXISTS size_code VARCHAR(50)`
    ];

    for (const q of queries) {
        try {
            await db.query(q);
            console.log(`Executed: ${q.substring(0, 50)}...`);
        } catch (e) {
            console.error(`Failed: ${q.substring(0, 50)}...`, e.message);
        }
    }
    console.log('Migration complete.');
    process.exit();
}
migrate();
