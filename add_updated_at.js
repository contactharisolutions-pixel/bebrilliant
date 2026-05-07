const db = require('./db');
async function addCol() {
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors'];
    for (const t of TABLES) {
        try {
            await db.query(`ALTER TABLE ${t} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            console.log(`Added updated_at to ${t}`);
        } catch (e) {
            console.log(`Failed for ${t}: ${e.message}`);
        }
    }
    process.exit();
}
addCol();
