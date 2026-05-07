// routes/ai_filler.routes.js — AI Intelligent Product Data Filler (V3 — Simplified)
//
// DESIGN:
//  • Structural fields (brand, model, category, shape, gender, material, mrp, etc.)
//    come FROM the existing unpublished product record — Excel does NOT overwrite them.
//  • Excel ONLY provides three supplementary fields:
//      - Measurement (Lens-Bridge-Temple)
//      - Lens Composite
//      - Lens Colorway
//  • Matching key: Brand + Model No (fuzzy) to find the best Excel row.
//  • AI generates: product_name, short_description, description,
//                  seo_title, seo_description, seo_keywords/tags
//  • Images: front-view auto-selected as main image; additional images attached.
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// ─── CALIBRATION ──────────────────────────────────────────────────────────────
function calibrateValue(val) {
    if (val === null || val === undefined) return '';
    let s = String(val).toLowerCase().trim();
    s = s.replace(/[\s\-_./\\]+/g, '');
    const aliases = {
        'rayban': 'rayban', 'ray-ban': 'rayban', 'ray ban': 'rayban',
        'oakley': 'oakley', 'policecop': 'police', 'police': 'police',
        'titancraftsman': 'titan', 'titan': 'titan', 'carrera': 'carrera',
        'fastrack': 'fastrack', 'vincent chase': 'vincentchase',
        'vincent-chase': 'vincentchase', 'vincentchase': 'vincentchase',
    };
    return aliases[s] || s;
}

/** Extract only the three supplementary fields from an Excel row via mapping */
function calibrateRow(rawRow, mapping) {
    const get = (keys) => {
        for (const k of keys) {
            const mapped = mapping[k];
            if (mapped && rawRow[mapped] !== undefined && rawRow[mapped] !== '')
                return String(rawRow[mapped]).trim();
            if (rawRow[k] !== undefined && rawRow[k] !== '')
                return String(rawRow[k]).trim();
        }
        return '';
    };
    return {
        // Matching keys
        brand: get(['Brand', 'brand', 'Brand Name', 'BrandName']),
        model_no: get(['Model No', 'Model Code', 'Model', 'model_no', 'ModelNo', 'Model Number']),
        // Measurement — three separate columns
        lens_width: get(['Lens Width', 'lens_width', 'LensWidth', 'Eye Size', 'Lens Size', 'Eye']),
        bridge_size: get(['Bridge Width', 'bridge_width', 'BridgeWidth', 'Bridge', 'Nose Bridge-Size', 'Nose Bridge']),
        temple_length: get(['Temple Length', 'temple_length', 'TempleLength', 'Temple', 'Arm Length']),
        // Supplementary master-linked fields
        gender: get(['Gender', 'gender', 'Gender Type', 'For Gender']),
        shape: get(['Shape', 'shape', 'Frame Shape', 'FrameShape']),
        material: get(['Frame Material', 'Front Material', 'material', 'Material', 'FrameMaterial', 'Frame Mat']),
        // Other supplementary fields
        lens_composite: get(['Lens Composite', 'lens_composite', 'LensComposite', 'Composite', 'Lens Material', 'LensType']),
        lens_colorway: get(['Lens Colorway', 'lens_colorway', 'LensColorway', 'Colorway', 'Lens Color', 'Lens Colour', 'Lens Colour Way']),
        frame_type: get(['Frame Type', 'frame_type', 'FrameType', 'Type', 'Mounting', 'Rim Type']),
    };
}

/** Auto-detect column mapping — only the fields we need */
function autoDetectMapping(headers) {
    const mapping = {};
    const PATTERNS = {
        'Brand': [/brand/i],
        'Model No': [/model[\s_-]?no/i, /model[\s_-]?num/i, /model[\s_-]?code/i, /^model$/i],
        'Lens Width': [/lens[\s_-]?width/i, /lens[\s_-]?size/i, /eye[\s_-]?size/i, /^eye$/i],
        'Bridge Width': [/bridge[\s_-]?width/i, /^bridge$/i, /nose[\s_-]?bridge/i],
        'Temple Length': [/temple[\s_-]?length/i, /^temple$/i, /arm[\s_-]?length/i],
        'Gender': [/^gender$/i, /gender[\s_-]?type/i, /for[\s_-]?gender/i],
        'Shape': [/^shape$/i, /frame[\s_-]?shape/i],
        'Frame Material': [/frame[\s_-]?mat/i, /front[\s_-]?mat/i, /^material$/i, /\bmat\b/i],
        'Lens Composite': [/lens[\s_-]?comp/i, /composite/i],
        'Lens Colorway': [/lens[\s_-]?colo(?:u?r)?(?:[\s_-]?way)?/i, /colorway/i, /colourway/i],
        'Frame Type': [/frame[\s_-]?type/i, /rim[\s_-]?type/i, /^type$/i, /mounting/i],
    };
    for (const [key, pats] of Object.entries(PATTERNS)) {
        for (const h of headers) {
            if (pats.some(p => p.test(h.trim()))) { mapping[key] = h; break; }
        }
    }
    return mapping;
}

// ─── FUZZY MATCH ──────────────────────────────────────────────────────────────
function levenshtein(a, b) {
    a = calibrateValue(a); b = calibrateValue(b);
    if (a === b) return 0;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array(n + 1).fill(0).map((_, j) => j === 0 ? i : 0));
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

function strSimilarity(a, b) {
    a = calibrateValue(a); b = calibrateValue(b);
    if (!a || !b) return 0;
    if (a === b) return 100;
    const maxLen = Math.max(a.length, b.length);
    return Math.round((1 - levenshtein(a, b) / maxLen) * 100);
}

function computeMatchScore(product, row) {
    const brandScore = strSimilarity(product.brand_name, row.brand);
    const modelScore = strSimilarity(product.model_no, row.model_no);
    // Model is the primary key — weight heavily
    const score = (brandScore * 0.30) + (modelScore * 0.70);
    return { score: Math.round(score), brandScore, modelScore };
}

function confidenceLabel(score) {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

// ─── IMAGE SELECTION — front-view priority ────────────────────────────────────
// VIEW_PRIORITY: first match wins — mapped to canonical view labels
const VIEW_KEYWORDS = [
    { view: 'front', keywords: ['front', 'frnt', 'ffront', 'main', 'center', 'centre', 'hero', 'default'] },
    { view: 'angle', keywords: ['angle', 'cframe', 'angl', 'three-quarter', '3q', 'diagonal', 'perspective'] },
    { view: 'side', keywords: ['side', 'profile', 'lateral'] },
    { view: 'back', keywords: ['back', 'rear', 'reverse'] },
    { view: 'tint', keywords: ['tint', 'lens', 'lense', 'color', 'colour', 'shade'] },
    { view: 'detail', keywords: ['detail', 'close', 'macro', 'zoom'] },
];

function detectView(filename) {
    const f = (filename || '').toLowerCase().replace(/[_\-\s.]+/g, '');
    for (const { view, keywords } of VIEW_KEYWORDS) {
        if (keywords.some(k => f.includes(k))) return view;
    }
    return 'other';
}

function selectProductImages(modelNo, colorCode, mediaItems) {
    const modelClean = calibrateValue(modelNo);
    const colorClean = colorCode ? calibrateValue(colorCode) : '';
    if (!modelClean) return { mainImage: null, additionalImages: [], imageStatus: 'missing', imageView: null, imageCount: 0 };

    const matched = mediaItems.filter(m => {
        const fname = calibrateValue(m.file_name || '');
        if (!fname.includes(modelClean)) return false;
        if (colorClean && !fname.includes(colorClean)) return false;
        return true;
    });
    if (!matched.length) return { mainImage: null, additionalImages: [], imageStatus: 'missing', imageView: null, imageCount: 0 };

    const frontIdx = matched.findIndex(m => detectView(m.file_name) === 'front');
    
    let mainImageObj = null;
    let fallbackAdditional = matched;

    if (frontIdx !== -1) {
        mainImageObj = matched[frontIdx];
        fallbackAdditional = matched.filter((_, idx) => idx !== frontIdx);
    }

    const additionalImagesData = fallbackAdditional.map(m => ({ url: m.file_url, view: detectView(m.file_name), name: m.file_name }));

    return {
        mainImage: mainImageObj ? mainImageObj.file_url : null,
        additionalImages: additionalImagesData,
        imageStatus: mainImageObj ? 'found' : 'missing',
        imageView: mainImageObj ? 'front' : null,
        imageCount: matched.length,
    };
}

// ─── AI CONTENT GENERATOR ─────────────────────────────────────────────────────
async function generateAIContent(attrs) {
    const { brand, model, category, gender, shape, material, frameType,
        colorCode, lensColorway, lensComposite, measurement, mrp } = attrs;

    // Auto-generate product name
    const productName = `${brand || ''} ${model || ''}`.trim();

    if (genAI) {
        try {
            const aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are a premium eyewear product copywriter for BlinkOpticals, an Indian optical retailer.

Product details:
- Brand: ${brand || 'Unknown'}
- Model: ${model || 'N/A'}
- Product Name: ${productName}
- Category: ${category || 'Eyewear'}
- Gender: ${gender || 'Unisex'}
- Shape: ${shape || 'N/A'}
- Frame Material: ${material || 'N/A'}
- Frame Type: ${frameType || 'N/A'}
- Frame Color: ${colorCode || 'N/A'}
- Lens Colorway: ${lensColorway || 'N/A'}
- Lens Composite: ${lensComposite || 'N/A'}
- Measurement: ${measurement || 'N/A'}
- MRP: ₹${mrp || 'N/A'}

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "product_name": "${productName}",
  "short_description": "1-2 punchy sentences, USP-focused, max 120 chars",
  "description": "3-4 paragraphs: 1) Style & design overview 2) Materials & comfort 3) Occasion & lifestyle fit 4) BlinkOpticals promise. Use plain text only.",
  "seo_title": "50-60 chars. Format: Brand Model – Shape Category for Gender | BlinkOpticals",
  "seo_description": "130-155 chars meta description with brand, key feature, and CTA",
  "keywords": "8-12 comma-separated keywords: brand, model, shape, material, gender, category variations"
}`;
            const result = await aiModel.generateContent(prompt);
            const rawText = (await result.response).text().replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(rawText);
            return {
                product_name: parsed.product_name || productName,
                short_description: parsed.short_description || '',
                description: parsed.description || '',
                seo_title: parsed.seo_title || '',
                seo_description: parsed.seo_description || '',
                tags: parsed.keywords || '',
            };
        } catch (err) {
            console.warn('[AI Filler] Gemini error, using template:', err.message);
        }
    }

    // Template fallback
    const G = gender || 'Unisex', B = brand || 'BlinkOpticals', Mod = model || '';
    const S = shape || '', C = category || 'Eyewear', Mat = material || '';
    return {
        product_name: productName,
        short_description: `${B} ${Mod} — stylish ${S} ${C.toLowerCase()} crafted for the modern ${G.toLowerCase()}.`,
        description: `Introducing the ${B} ${Mod}, a sophisticated eyewear piece for the discerning ${G.toLowerCase()}. The ${S} silhouette blends classic style with contemporary design, making it suitable for any occasion.\n\nCrafted from premium ${Mat || 'quality'} material, these frames deliver exceptional durability without compromising on comfort. The ${frameType || ''} design ensures a secure all-day fit.\n\n${lensColorway ? `The ${lensColorway} lens colorway offers an added touch of personality and style.` : ''} Whether for vision correction or as a fashion statement, the ${B} ${Mod} excels on every front.\n\nAvailable exclusively at BlinkOpticals — India's trusted eyewear destination. Authentic products, expert fitting, and free home delivery.`,
        seo_title: `${B} ${Mod} ${S} ${C} for ${G} | BlinkOpticals`,
        seo_description: `Shop ${B} ${Mod} ${C.toLowerCase()} at BlinkOpticals. ${Mat ? `Premium ${Mat} frames. ` : ''}Perfect for the modern ${G.toLowerCase()}. Free shipping & expert consultation.`,
        tags: `${B}, ${Mod}, ${S} ${C.toLowerCase()}, ${G.toLowerCase()} eyewear, ${Mat} frames, ${C.toLowerCase()} online, buy glasses india, BlinkOpticals`,
    };
}

async function batchGenerateContent(items, batchSize = 5, delayMs = 400) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(attrs => generateAIContent(attrs)));
        results.push(...batchResults);
        if (i + batchSize < items.length)
            await new Promise(r => setTimeout(r, delayMs));
    }
    return results;
}

// ─── POST /detect-columns ─────────────────────────────────────────────────────
router.post('/detect-columns', auth, rbac('Admin', 'Manager'), upload.single('excel'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'Excel file required' });
    try {
        const xlsx = require('xlsx');
        const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
        if (!rows.length) return res.status(400).json({ success: false, error: 'Excel is empty' });

        const headers = Object.keys(rows[0]);
        const autoMapping = autoDetectMapping(headers);
        const sampleRow = calibrateRow(rows[0], autoMapping);
        const biz = req.user.business_id;

        let savedMapping = null;
        try {
            const t = await db.query(
                `SELECT mapping FROM ai_column_mapping_templates WHERE business_id=$1 ORDER BY updated_at DESC LIMIT 1`,
                [biz]
            );
            if (t.rows[0]) savedMapping = t.rows[0].mapping;
        } catch (_) { }

        res.json({ success: true, headers, autoMapping, savedMapping, sampleRow, totalRows: rows.length, sheetName: wb.SheetNames[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Column detection failed: ' + err.message });
    }
});

// ─── POST /save-mapping ───────────────────────────────────────────────────────
router.post('/save-mapping', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { mapping } = req.body;
    if (!mapping) return res.status(400).json({ success: false, error: 'mapping required' });
    const biz = req.user.business_id;

    const upsert = async () => db.query(`
        INSERT INTO ai_column_mapping_templates (business_id, mapping, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (business_id) DO UPDATE SET mapping=$2, updated_at=NOW()
    `, [biz, JSON.stringify(mapping)]);

    try {
        await upsert();
        res.json({ success: true });
    } catch (_) {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS ai_column_mapping_templates (
                    business_id TEXT PRIMARY KEY,
                    mapping JSONB NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await upsert();
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    }
});

// ─── POST /analyze ────────────────────────────────────────────────────────────
router.post('/analyze', auth, rbac('Admin', 'Manager'), upload.single('excel'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'Excel file required' });
    const biz = req.user.business_id;

    let columnMapping = {};
    try { columnMapping = req.body.mapping ? JSON.parse(req.body.mapping) : {}; } catch (_) { }

    try {
        // 1. Parse Excel
        const xlsx = require('xlsx');
        const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = xlsx.utils.sheet_to_json(ws, { defval: '' });
        if (!rawRows.length) return res.status(400).json({ success: false, error: 'Excel is empty' });

        const headers = Object.keys(rawRows[0]);
        const finalMapping = Object.keys(columnMapping).length ? columnMapping : autoDetectMapping(headers);
        const excelRows = rawRows.map(r => calibrateRow(r, finalMapping));

        // 2. Fetch unpublished products + master data via Supabase directly (no LATERAL JOIN)
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        const [
            { data: rawProducts },
            { data: brands },   { data: categories },
            { data: genders },  { data: frameTypes },
            { data: shapes },   { data: materials },
            { data: variants }
        ] = await Promise.all([
            supabase.from('product').select('product_id,product_name,model_no,mrp,short_description,description,brand_id,category_id,gender_id,frame_type_id,shape_id,material_id').eq('business_id', biz).eq('is_published', false).eq('active_status', true),
            supabase.from('brands').select('id,name').eq('business_id', biz),
            supabase.from('categories').select('id,name').eq('business_id', biz),
            supabase.from('genders').select('id,name').eq('business_id', biz),
            supabase.from('frame_types').select('id,name').eq('business_id', biz),
            supabase.from('shapes').select('id,name').eq('business_id', biz),
            supabase.from('materials').select('id,name').eq('business_id', biz),
            supabase.from('variant').select('variant_id,product_id,color_code,size_code').eq('business_id', biz)
        ]);

        // Build lookup maps
        const brandMap    = Object.fromEntries((brands     || []).map(r => [r.id, r.name]));
        const catMap      = Object.fromEntries((categories || []).map(r => [r.id, r.name]));
        const genderLkMap = Object.fromEntries((genders    || []).map(r => [r.id, r.name]));
        const ftMap       = Object.fromEntries((frameTypes || []).map(r => [r.id, r.name]));
        const shapeMap    = Object.fromEntries((shapes     || []).map(r => [r.id, r.name]));
        const matMap      = Object.fromEntries((materials  || []).map(r => [r.id, r.name]));

        // First variant per product
        const variantMap = {};
        (variants || []).forEach(v => { if (!variantMap[v.product_id]) variantMap[v.product_id] = v; });

        // Enrich products in JS
        const products = (rawProducts || []).map(p => ({
            ...p,
            brand_name:     brandMap[p.brand_id]     || '',
            category_name:  catMap[p.category_id]    || '',
            gender_name:    genderLkMap[p.gender_id] || '',
            frame_type_name: ftMap[p.frame_type_id]  || '',
            shape_name:     shapeMap[p.shape_id]     || '',
            material_name:  matMap[p.material_id]    || '',
            color_code:     variantMap[p.product_id]?.color_code || '',
            size_code:      variantMap[p.product_id]?.size_code  || '',
            primary_variant_id: variantMap[p.product_id]?.variant_id || null
        }));

        // Master lookup maps for resolving Excel values to IDs
        const normalize = s => String(s || '').toLowerCase().replace(/[\s\-_]+/g, '');
        const buildMap  = arr => Object.fromEntries((arr || []).flatMap(r => [[normalize(r.name), r.id], [r.name.toUpperCase(), r.id]]));
        const genderMap    = buildMap(genders);
        const shapeIdMap    = buildMap(shapes);
        const materialMap  = buildMap(materials);
        const frameTypeMap = buildMap(frameTypes);


        const resolveId = (map, val) => {
            if (!val) return null;
            const key = normalize(val);
            return map[key] || map[val.toUpperCase()] || Object.entries(map).find(([k]) => k.includes(key) || key.includes(k))?.[1] || null;
        };

        // 3. Fetch media library
        const { data: mediaItemsRaw } = await supabase.from('media_library').select('id,file_name,file_url,thumbnail_url').eq('business_id', biz);
        const mediaItems = mediaItemsRaw || [];


        // 4. Phase 1 — Match each product to its best Excel row (for supplementary fields only)
        const structuralResults = products.map(product => {
            let bestRow = null, bestScore = 0, bestFactors = {};
            for (const row of excelRows) {
                const { score, ...factors } = computeMatchScore(product, row);
                if (score > bestScore) { bestScore = score; bestRow = row; bestFactors = factors; }
            }

            const confidence = confidenceLabel(bestScore);
            const warnings = [];

            // Supplementary fields from Excel — measurement split into 3 parts
            let lensWidth = bestRow?.lens_width || '';
            let bridgeSize = bestRow?.bridge_size || '';
            let templeLength = bestRow?.temple_length || '';
            
            // If individual columns are missing, try to parse from combined excel row keys (legacy)
            if (!lensWidth && !bridgeSize && !templeLength) {
                const combined = bestRow?.Measurement || bestRow?.measurement || bestRow?.Size || bestRow?.Dimensions || '';
                if (combined) {
                    const parts = String(combined).split(/[\s\-_/x]+/).filter(Boolean);
                    if (parts.length >= 2) {
                        lensWidth = parts[0];
                        bridgeSize = parts[1];
                        templeLength = parts[2] || '';
                    }
                }
            }

            const lensComposite = bestRow?.lens_composite || '';
            const lensColorway = bestRow?.lens_colorway || '';

            // Master-linked supplementary fields from Excel (resolve to IDs)
            const excelGenderText = bestRow?.gender || '';
            const excelShapeText = bestRow?.shape || '';
            const excelMaterialText = bestRow?.material || '';
            const excelFrameTypeText = bestRow?.frame_type || '';
            
            const resolvedGenderId = resolveId(genderMap, excelGenderText);
            const resolvedShapeId = resolveId(shapeIdMap, excelShapeText);
            const resolvedMaterialId = resolveId(materialMap, excelMaterialText);
            const resolvedFrameTypeId = resolveId(frameTypeMap, excelFrameTypeText);

            // Effective display names (excel overrides product if resolved)
            const effectiveGender = excelGenderText || product.gender_name || '';
            const effectiveShape = excelShapeText || product.shape_name || '';
            const effectiveMaterial = excelMaterialText || product.material_name || '';
            const effectiveFrameType = excelFrameTypeText || product.frame_type_name || '';

            if (bestScore < 40) warnings.push('No reliable Excel match found — AI will still generate content from product record');
            if (excelGenderText && !resolvedGenderId) warnings.push(`Gender "${excelGenderText}" not found in master data`);
            if (excelShapeText && !resolvedShapeId) warnings.push(`Shape "${excelShapeText}" not found in master data`);
            if (excelMaterialText && !resolvedMaterialId) warnings.push(`Material "${excelMaterialText}" not found in master data`);
            if (excelFrameTypeText && !resolvedFrameTypeId) warnings.push(`Frame Type "${excelFrameTypeText}" not found in master data`);

            // Image selection
            const imgData = selectProductImages(product.model_no, product.color_code, mediaItems);

            // Build variant group key
            const variantKey = `${calibrateValue(product.brand_name)}|${calibrateValue(product.model_no)}`;

            // Build attrs for AI generation (use excel values when available)
            const measurementStr = [lensWidth, bridgeSize, templeLength].filter(Boolean).join('-');
            
            return {
                product_id: product.product_id,
                primary_variant_id: product.primary_variant_id,
                // ── Existing product data (read-only display reference) ────────────────────
                existing: {
                    product_name: product.product_name,
                    brand_name: product.brand_name,
                    model_no: product.model_no,
                    category: product.category_name,
                    gender: product.gender_name,
                    shape: product.shape_name,
                    frame_type: product.frame_type_name,
                    material: product.material_name,
                    color_code: product.color_code || '',
                    size_code: product.size_code || '',
                    mrp: product.mrp,
                    existing_desc: product.description,
                    existing_short: product.short_description,
                },
                // ── Fields from Excel (may override/fill product record on approve) ────────
                excel_data: {
                    lens_width: lensWidth,
                    bridge_size: bridgeSize,
                    temple_length: templeLength,
                    lens_composite: lensComposite,
                    lens_colorway: lensColorway,
                    // Master-linked fields
                    gender_text: excelGenderText,
                    gender_id: resolvedGenderId,
                    shape_text: effectiveShape,
                    shape_id: resolvedShapeId,
                    material_text: effectiveMaterial,
                    material_id: resolvedMaterialId,
                    frame_type_text: excelFrameTypeText,
                    frame_type_id: resolvedFrameTypeId
                },
                // ── AI content — filled in Phase 2 ────────────────────────────────────────
                ai_content: {
                    product_name: '',
                    short_description: '',
                    description: '',
                    seo_title: '',
                    seo_description: '',
                    tags: '',
                },
                // ── Image data ────────────────────────────────────────────────────────────
                matched_image: imgData.mainImage,
                main_image_view: imgData.imageView,
                additional_images: imgData.additionalImages,
                image_count: imgData.imageCount,
                image_status: imgData.imageStatus,
                // ── Match metadata ────────────────────────────────────────────────────────
                match_score: bestScore,
                match_confidence: confidence,
                match_factors: bestFactors,
                warnings,
                status: 'pending',
                ai_content_status: 'pending',
                variant_group_key: variantKey,
                // Build attrs for AI generation (use excel values when available)
                _ai_attrs: {
                    brand: product.brand_name || '',
                    model: product.model_no || '',
                    category: product.category_name || '',
                    gender: effectiveGender,
                    shape: effectiveShape,
                    material: effectiveMaterial,
                    frameType: effectiveFrameType,
                    colorCode: product.color_code || '',
                    lensColorway,
                    lensComposite,
                    measurement: measurementStr,
                    mrp: product.mrp || 0,
                }
            };
        });

        // 5. Phase 2 — AI content generation
        console.log(`[AI Filler V3] Generating AI content for ${structuralResults.length} products...`);
        const aiAttrs = structuralResults.map(r => r._ai_attrs);
        const aiContents = await batchGenerateContent(aiAttrs, 5, 400);

        // 6. Merge AI content, build variant group summary
        let results = structuralResults.map((item, idx) => {
            delete item._ai_attrs;
            item.ai_content = aiContents[idx] || {};
            item.ai_content_status = 'generated';
            return item;
        });

        // Show all products; imageStatus flags whether an image was auto-linked
        // (removing hard filter that was hiding ALL products when media library is small)

        const variantGroups = {};
        results.forEach(item => {
            if (!variantGroups[item.variant_group_key]) variantGroups[item.variant_group_key] = 0;
            variantGroups[item.variant_group_key]++;
        });

        const stats = {
            total: results.length,
            high_confidence: results.filter(r => r.match_confidence === 'high').length,
            medium_confidence: results.filter(r => r.match_confidence === 'medium').length,
            low_confidence: results.filter(r => r.match_confidence === 'low').length,
            images_found: results.length, // Since we filtered, all are found
            images_missing: 0, 
            excel_rows: excelRows.length,
            ai_generated: results.filter(r => r.ai_content_status === 'generated').length,
            variant_groups: Object.keys(variantGroups).length,
            ai_engine: genAI ? 'Gemini 1.5 Flash' : 'Template (no API key)',
        };

        console.log('[AI Filler V3] Done (Filtered):', stats);
        res.json({ success: true, results, stats, variantGroups, columnMapping: finalMapping });

    } catch (err) {
        console.error('[ai-filler analyze]', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Analysis failed: ' + err.message });
    }
});

// ─── POST /regenerate-content ─────────────────────────────────────────────────
router.post('/regenerate-content', auth, rbac('Admin', 'Manager'), async (req, res) => {
    try {
        const content = await generateAIContent(req.body);
        res.json({ success: true, data: content });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /approve ────────────────────────────────────────────────────────────
router.post('/approve', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { approvals } = req.body;
    console.log(`[AI Filler Approve] Received: ${approvals?.length} | Biz: ${req.user?.business_id}`);
    
    if (!approvals?.length) return res.status(400).json({ success: false, error: 'No approvals' });
    const biz = req.user.business_id;
    let applied = 0, failed = 0, errors = [];

    // Use Supabase directly — db.pool doesn't exist on the proxy
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    for (const item of approvals) {
        try {
            const ai = item.ai_content || {};
            const ex = item.excel_data || {};
            if (!item.product_id) { failed++; continue; }

            let lw = ex.lens_width  || ex.LensWidth  || null;
            let bs = ex.bridge_size || ex.bridge_width || ex.BridgeWidth || null;
            let tl = ex.temple_length || ex.temple_width || ex.TempleLength || null;
            if (!lw && !bs && !tl) {
                const combined = ex.measurement || ex.Measurement || ex.Size || '';
                if (combined) {
                    const parts = String(combined).split(/[\s\-_/x]+/).filter(Boolean);
                    lw = parts[0] || null; bs = parts[1] || null; tl = parts[2] || null;
                }
            }

            const tagsArr = ai.tags
                ? (Array.isArray(ai.tags) ? ai.tags : String(ai.tags).split(',').map(s => s.trim()).filter(Boolean))
                : null;

            const additionalUrls = (item.additional_images || [])
                .map(img => typeof img === 'string' ? img : (img.url || img)).filter(Boolean);

            const update = {};
            if (ai.product_name)      update.product_name      = ai.product_name;
            if (ai.short_description) update.short_description = ai.short_description;
            if (ai.description)       update.description       = ai.description;
            if (ai.seo_title)         update.seo_title         = ai.seo_title;
            if (ai.seo_description)   update.seo_description   = ai.seo_description;
            if (tagsArr?.length)      update.tags              = tagsArr;
            if (lw)                   update.lens_width        = String(lw);
            if (bs)                   update.bridge_size       = String(bs);
            if (tl)                   update.temple_length     = String(tl);
            if (ex.lens_composite)    update.lens_composite    = String(ex.lens_composite);
            if (ex.lens_colorway)     update.lens_colorway     = String(ex.lens_colorway);
            if (ex.gender_id)         update.gender_id         = String(ex.gender_id);
            if (ex.shape_id)          update.shape_id          = String(ex.shape_id);
            if (ex.material_id)       update.material_id       = String(ex.material_id);
            if (ex.frame_type_id)     update.frame_type_id     = String(ex.frame_type_id);
            if (item.matched_image)   update.main_image        = item.matched_image;
            if (additionalUrls.length) update.additional_images = additionalUrls;
            update.is_published  = true;
            update.active_status = true;

            const { error: uErr } = await supabase.from('product')
                .update(update)
                .eq('product_id', item.product_id)
                .eq('business_id', biz);

            if (uErr) throw new Error(uErr.message);

            // Log (non-critical)
            await supabase.from('ai_processing_log').insert({
                log_id:           `afl_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                business_id:      biz,
                product_id:       item.product_id,
                match_status:     'approved',
                confidence_score: Number(item.match_score) || 0,
                processed_by:     req.user.id || req.user.user_id || 'admin',
                processed_at:     new Date().toISOString()
            }).onConflict('log_id');

            applied++;
        } catch (e) {
            console.error(`[AI Filler Approve Error] ID: ${item.product_id}`, e.message);
            failed++;
            errors.push({ product_id: item.product_id, error: e.message });
        }
    }

    res.json({ success: true, applied, failed, errors });
});

// ─── POST /reject ─────────────────────────────────────────────────────────────
router.post('/reject', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { product_ids } = req.body;
    if (!product_ids?.length) return res.status(400).json({ success: false, error: 'No product IDs' });
    const biz = req.user.business_id;
    for (const pid of product_ids) {
        const log_id = `afl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
            await db.query(`
                INSERT INTO ai_processing_log (log_id,business_id,product_id,match_status,confidence_score,processed_by,processed_at)
                VALUES ($1,$2,$3,'rejected',0,$4,NOW()) ON CONFLICT DO NOTHING
            `, [log_id, biz, pid, req.user.id || 'admin']);
        } catch (_) { }
    }
    res.json({ success: true, rejected: product_ids.length });
});

// ─── GET /logs ────────────────────────────────────────────────────────────────
router.get('/logs', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const biz = req.user.business_id;
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        const [{ data: logs }, { data: products }] = await Promise.all([
            supabase.from('ai_processing_log').select('*').eq('business_id', biz).order('processed_at', { ascending: false }).limit(200),
            supabase.from('product').select('product_id,product_name,model_no,brand_id').eq('business_id', biz)
        ]);
        const { data: brands } = await supabase.from('brands').select('id,name').eq('business_id', biz);

        const pMap = Object.fromEntries((products || []).map(p => [p.product_id, p]));
        const bMap = Object.fromEntries((brands   || []).map(b => [b.id, b.name]));

        const rows = (logs || []).map(l => ({
            ...l,
            product_name: pMap[l.product_id]?.product_name || '—',
            model_no:     pMap[l.product_id]?.model_no     || '—',
            brand_name:   bMap[pMap[l.product_id]?.brand_id] || '—'
        }));

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[AI Filler logs error]', err.message);
        res.json({ success: true, data: [] });
    }
});

module.exports = router;
