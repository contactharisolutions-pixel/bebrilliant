const db = require('./db');
const BIZ = 'biz_blink_001';

const products = [
    {
        name: 'Black Aviator - Series X',
        price: 8500,
        category: 'Sunglasses',
        brand: 'Blink Premier',
        gender: 'Men',
        type: 'Full Rim',
        shape: 'Aviator',
        image: '/public/artifacts/sunglasses_overlay_1_1776316931718.png',
        desc: 'Signature 2026 Edition. Polarized lenses, ultra-light titanium frame with soft silicone gel nose pads.'
    },
    {
        name: 'Crystal Cat-Eye Tech',
        price: 9200,
        category: 'Spectacles',
        brand: 'Vista',
        gender: 'Women',
        type: 'Full Rim',
        shape: 'Cat Eye',
        image: '/public/artifacts/eyeglasses_overlay_1_1776316955292.png',
        desc: 'Sophisticated transparency. Ultra-light rose gold tech embedded in premium acetate.'
    },
    {
        name: 'Titanium Rimless Pro',
        price: 12500,
        category: 'Spectacles',
        brand: 'Aero',
        gender: 'Unisex',
        type: 'Rimless',
        shape: 'Rectangular',
        image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80',
        desc: 'Business class rimless frames. Less than 8 grams total weight.'
    },
    {
        name: 'Vanguard Amber',
        price: 6000,
        category: 'Sunglasses',
        brand: 'Vanguard',
        gender: 'Men',
        type: 'Full Rim',
        shape: 'Wayfarer',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
        desc: 'Retro vibes with high-tech UV400 nano-coatings.'
    }
];

async function seed() {
    // Ensure brands exist
    const brands = [...new Set(products.map(p => p.brand))];
    for(const b of brands) {
        await db.query(`INSERT INTO brands (business_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (business_id, name) DO NOTHING`, [BIZ, b, b.toLowerCase().replace(/ /g, '-')]);
    }

    for (const p of products) {
        try {
            const query = `
                INSERT INTO product (
                    product_id, business_id, product_name, selling_price, mrp,
                    brand_id, category_id, gender_id, frame_type_id, shape_id,
                    main_image, description, active_status
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    (SELECT id FROM brands WHERE name = $6 LIMIT 1),
                    (SELECT id FROM categories WHERE name = $7 LIMIT 1),
                    (SELECT id FROM genders WHERE name = $8 LIMIT 1),
                    (SELECT id FROM frame_types WHERE name = $9 LIMIT 1),
                    (SELECT id FROM shapes WHERE name = $10 LIMIT 1),
                    $11, $12, true
                )
            `;
            await db.query(query, [
                'prod_' + Math.random().toString(36).substr(2, 9),
                BIZ, p.name,
                p.price, p.price * 1.2,
                p.brand, p.category, p.gender, p.type, p.shape,
                p.image, p.desc
            ]);
            console.log(`Seeded: ${p.name}`);
        } catch (e) {
            console.error(`Error seeding ${p.name}:`, e.message);
        }
    }
    console.log('Product seeding complete.');
    process.exit();
}
seed();
