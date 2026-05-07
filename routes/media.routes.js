const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { processMedia } = require('../utils/media-processor');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

// Create Folder
router.post('/folders', async (req, res) => {
    try {
        const { business_id, folder_name, parent_id } = req.body;
        if (!business_id || !folder_name) return res.status(400).json({ success: false, error: 'Missing required fields' });

        const r = await db.query(
            `INSERT INTO media_folders (business_id, folder_name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
            [business_id, folder_name, parent_id || null]
        );
        res.json({ success: true, folder: r.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// List Folders
router.get('/folders', async (req, res) => {
    try {
        const { business_id } = req.query;
        if (!business_id) return res.status(400).json({ success: false, error: 'Missing business_id' });

        const r = await db.query(`SELECT * FROM media_folders WHERE business_id = $1 ORDER BY folder_name ASC`, [business_id]);
        res.json({ success: true, folders: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upload Media
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        
        const { business_id, folder_id, module_name } = req.body;
        const bizId = business_id || 'biz_blink_001';
        const modName = module_name || 'general';

        // Auto process & optimize
        const processed = await processMedia(req.file, bizId, modName);
        
        let type = 'document';
        if (req.file.mimetype.startsWith('image')) type = 'image';
        if (req.file.mimetype.startsWith('video')) type = 'video';

        // Insert to DB
        let finalFolderId = null;
        if (folder_id) {
            if (folder_id.match(/^[0-9a-fA-F-]{36}$/)) {
                finalFolderId = folder_id;
            } else {
                // Try to find folder by name for this business
                const f = await db.query(`SELECT id FROM media_folders WHERE folder_name ILIKE $1 AND business_id = $2`, [folder_id, bizId]);
                if (f.rows.length > 0) finalFolderId = f.rows[0].id;
                else {
                    // Create it if it doesn't exist? (Optional, let's just leave it null for now or create it)
                    const nc = await db.query(`INSERT INTO media_folders (business_id, folder_name) VALUES ($1, $2) RETURNING id`, [bizId, folder_id]);
                    finalFolderId = nc.rows[0].id;
                }
            }
        }

        const result = await db.query(
            `INSERT INTO media_library (
                business_id, file_name, file_type, file_url, thumbnail_url, folder_id, tags, size, width, height, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                bizId, req.file.originalname, type, processed.url, processed.thumbnail,
                finalFolderId, JSON.stringify(processed.tags), processed.size,
                processed.width || null, processed.height || null, 'system'
            ]
        );

        res.json({ success: true, media: result.rows[0] });
    } catch (err) {
        console.error('Upload route error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// List Media
router.get('/', async (req, res) => {
    try {
        const { business_id, folder_id, search, type } = req.query;
        if (!business_id) return res.status(400).json({ success: false, error: 'business_id required' });

        let q = `SELECT * FROM media_library WHERE business_id = $1`;
        let params = [business_id];
        let count = 2;

        if (folder_id && folder_id !== 'all') {
            if (folder_id.match(/^[0-9a-fA-F-]{36}$/)) {
                q += ` AND folder_id = $${count++}`;
                params.push(folder_id);
            } else {
                q += ` AND folder_id IN (SELECT id FROM media_folders WHERE folder_name ILIKE $${count++} AND business_id = $1)`;
                params.push(folder_id);
            }
        }
        
        if (type && type !== 'all') {
            q += ` AND file_type = $${count++}`;
            params.push(type);
        }

        if (search) {
            q += ` AND (file_name ILIKE $${count} OR tags::text ILIKE $${count})`;
            params.push(`%${search}%`);
            count++;
        }

        q += ` ORDER BY created_at DESC LIMIT 100`;

        const r = await db.query(q, params);
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mark Usage
router.post('/usage', async (req, res) => {
    try {
        const { media_id, module_name, reference_id } = req.body;
        if (!media_id || !module_name || !reference_id) return res.status(400).json({ success: false, error: 'Missing requirements' });

        await db.query(
            `INSERT INTO media_usage (media_id, module_name, reference_id) VALUES ($1, $2, $3)
             ON CONFLICT (media_id, module_name, reference_id) DO NOTHING`,
             [media_id, module_name, reference_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Global Replace (Update URL in library, effectively replacing it globally)
router.post('/replace/:id', upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const lib = await db.query('SELECT * FROM media_library WHERE id = $1', [id]);
        if (lib.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });

        const media = lib.rows[0];
        const processed = await processMedia(req.file, media.business_id, 'general');

        const result = await db.query(
            `UPDATE media_library SET file_name = $1, file_url = $2, thumbnail_url = $3, size = $4, width = $5, height = $6 WHERE id = $7 RETURNING *`,
            [req.file.originalname, processed.url, processed.thumbnail, processed.size, processed.width, processed.height, id]
        );

        res.json({ success: true, media: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Rename Media
router.put('/:id/rename', async (req, res) => {
    try {
        const { file_name } = req.body;
        if (!file_name || !file_name.trim()) return res.status(400).json({ success: false, error: 'file_name required' });
        const r = await db.query(
            `UPDATE media_library SET file_name = $1 WHERE id = $2 RETURNING id, file_name`,
            [file_name.trim(), req.params.id]
        );
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, media: r.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete Media
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM media_library WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
