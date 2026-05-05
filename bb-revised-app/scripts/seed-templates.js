const { supabaseAdmin } = require('./src/lib/supabase/admin');

async function seed() {
    const templates = [
        { name: 'CBSE Board Pattern (Subjective)', category: 'School', exam_type: 'Subjective', duration_minutes: 180, total_marks: 100, is_global: true },
        { name: 'JEE Main Mock (Objective)', category: 'Entrance', exam_type: 'Objective', duration_minutes: 180, total_marks: 300, is_global: true },
        { name: 'NEET Practice (Objective)', category: 'Entrance', exam_type: 'Objective', duration_minutes: 200, total_marks: 720, is_global: true }
    ];

    console.log('Seeding paper_templates...');
    const { data, error } = await supabaseAdmin.from('paper_templates').upsert(templates, { onConflict: 'name' }).select();
    
    if (error) {
        console.error('Seed error:', error);
    } else {
        console.log('Seeded templates:', data.length);
    }
}

seed();
