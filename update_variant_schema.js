const db = require('./db');
async function run() {
    await db.query(`
        ALTER TABLE variant ADD COLUMN IF NOT EXISTS variant_image TEXT;
        ALTER TABLE variant ADD COLUMN IF NOT EXISTS variant_price DECIMAL(12,2);
        ALTER TABLE variant ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
    `);
    console.log('Variant table updated with image, price, and barcode columns.');
    process.exit();
}
run();
