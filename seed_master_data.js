const db = require('./db');
const BIZ = 'biz_blink_001';

const SEED_DATA = {
    genders: ['Men', 'Women', 'Unisex', 'Kids'],
    frame_types: ['Full Rim', 'Half Rim', 'Rimless', 'Supra'],
    shapes: ['Aviator', 'Rectangular', 'Round', 'Wayfarer', 'Cat Eye', 'Oval', 'Square'],
    materials: ['Acetate', 'Metal', 'Titanium', 'TR90', 'Plastic', 'Ultem'],
    categories: ['Spectacles', 'Sunglasses', 'Reading Glasses', 'Contact Lenses', 'Accessories'],
    frame_colors: ['Black', 'Gold', 'Silver', 'Gunmetal', 'Tortoise', 'Blue', 'Red', 'Crystal', 'Rose Gold']
};

async function seed() {
    for (const [table, names] of Object.entries(SEED_DATA)) {
        console.log(`Seeding ${table}...`);
        for (const name of names) {
            const slug = name.toLowerCase().replace(/ /g, '-');
            try {
                await db.query(
                    `INSERT INTO ${table} (business_id, name, slug, active_status) 
                     VALUES ($1, $2, $3, true) 
                     ON CONFLICT (business_id, name) DO NOTHING`,
                    [BIZ, name, slug]
                );
            } catch (e) {
                console.error(`Error seeding ${name} into ${table}:`, e.message);
            }
        }
    }
    
    // Also fix any existing NULL IDs in categories specifically
    await db.query(`UPDATE categories SET business_id = $1 WHERE business_id IS NULL`, [BIZ]);
    
    console.log('Seeding complete.');
    process.exit();
}
seed();
