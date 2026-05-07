const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

router.post('/generate-content', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { brand, model, category, gender, shape, material, frame_type, color, lens_material, lens_color } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        // Fallback Template logic if no API key
        return res.json({
            success: true,
            isSimulation: true,
            data: {
                product_name: `${brand} ${model} ${shape} ${category} for ${gender}`,
                short_description: `Stylish ${color} ${shape} ${category} made with premium ${material}. Optimized for ${gender}.`,
                full_description: `Elevate your vision with these ${brand} ${model} ${category}. Crafted from high-quality ${material}, these ${shape} frames offer a perfect blend of style and comfort. The ${frame_type} design ensures durability, while the ${lens_color} ${lens_material} lenses provide superior optical clarity. Perfect for ${gender} who value both fashion and function.`,
                tags: [brand, category, gender, shape, material].join(','),
                seo_title: `Buy ${brand} ${model} - Classic ${shape} ${category} for ${gender} | BlinkOpticals`,
                seo_description: `Shop the ${brand} ${model} ${category}. Featuring a ${shape} ${material} frame in ${color}. Free shipping on all orders.`,
                seo_keywords: `${brand}, ${category}, ${shape} eyewear, ${gender} glasses, ${material} frames`
            }
        });
    }

    try {
        const modelAI = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Generate premium ecommerce content for eyewear. 
        Brand: ${brand}, Model: ${model}, Category: ${category}, Gender: ${gender}, Shape: ${shape}, Material: ${material}, Frame Type: ${frame_type}, Frame Color: ${color}, Lens Material: ${lens_material}, Lens Color: ${lens_color}.
        
        Return ONLY a JSON object with:
        product_name: Catchy name (e.g. "Brand Model Shape Category for Gender")
        short_description: 1-2 lines punchy.
        full_description: 3-4 paragraphs (Style, Material/Comfort, Occasion).
        tags: comma separated list of 5-8 tags.
        seo_title: Professional title tag (50-60 characters, include Brand + Style).
        seo_description: Meta description for Google (120-160 characters, clear USP).
        seo_keywords: 5-8 relevant keywords.`;

        const result = await modelAI.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/ai/tag-image — Multimodal tagging
router.post('/tag-image', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { media_id } = req.body;
    const { business_id } = req.user;

    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ success: false, error: 'AI Key not configured' });

    try {
        const { rows } = await db.query('SELECT file_url FROM media_library WHERE id = $1 AND business_id = $2', [media_id, business_id]);
        if (!rows[0]) return res.status(404).json({ success: false, error: 'Media not found' });

        const imageUrl = rows[0].file_url;
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        const modelAI = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Analyze this image and provide 5-10 descriptive tags for it as a comma separated list. Focus on eyewear style, shape, color, and material if applicable. Return only the tags.";

        const result = await modelAI.generateContent([
            prompt,
            { inlineData: { data: base64, mimeType: "image/webp" } }
        ]);

        const tagsText = (await result.response).text().trim();
        const tags = tagsText.split(',').map(t => t.trim()).filter(t => t);

        await db.query('UPDATE media_library SET tags = $1 WHERE id = $2', [tags, media_id]);

        res.json({ success: true, tags });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
