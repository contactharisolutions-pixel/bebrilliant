'use strict';
/**
 * Media Processor — Local Disk Storage + Sharp Optimization
 * Stores all media in public/uploads/media/<businessId>/<module>/
 * Files are served statically by Express from /uploads/...
 */
const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'media');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function randomHex() {
    return crypto.randomBytes(8).toString('hex');
}

/** Returns a web-accessible URL path */
function toPublicUrl(absPath) {
    // e.g. G:\My Projects\BlinkOpticals\public\uploads\media\... -> /uploads/media/...
    const rel = path.relative(path.join(process.cwd(), 'public'), absPath);
    return '/' + rel.replace(/\\/g, '/');
}

async function processImage(file, businessId, moduleName) {
    const hash     = randomHex();
    const rawName  = path.basename(file.originalname, path.extname(file.originalname))
                        .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const finalName = `${rawName}-${hash}`;

    const origDir  = path.join(UPLOAD_ROOT, businessId, moduleName, 'original');
    const thumbDir = path.join(UPLOAD_ROOT, businessId, moduleName, 'thumbnails');
    ensureDir(origDir);
    ensureDir(thumbDir);

    const origPath  = path.join(origDir,  `${finalName}.webp`);
    const thumbPath = path.join(thumbDir, `${finalName}_thumb.webp`);

    // Convert & compress original → WebP 80 %
    const origBuf = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    fs.writeFileSync(origPath, origBuf);

    // Generate thumbnail 150×150 cover (true 1:1 square) → WebP 70%
    const thumbBuf = await sharp(file.buffer)
        .resize(150, 150, { fit: 'cover', position: 'centre' })
        .webp({ quality: 70 })
        .toBuffer();
    fs.writeFileSync(thumbPath, thumbBuf);

    const meta = await sharp(file.buffer).metadata();

    return {
        url:       toPublicUrl(origPath),
        thumbnail: toPublicUrl(thumbPath),
        width:     meta.width  || null,
        height:    meta.height || null,
        size:      origBuf.length,
        tags:      ['image', moduleName]
    };
}

async function processVideo(file, businessId, moduleName) {
    const hash      = randomHex();
    const rawName   = path.basename(file.originalname, path.extname(file.originalname))
                         .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const finalName = `${rawName}-${hash}`;

    const videoDir = path.join(UPLOAD_ROOT, businessId, moduleName, 'videos');
    ensureDir(videoDir);

    const ext       = path.extname(file.originalname) || '.mp4';
    const videoPath = path.join(videoDir, `${finalName}${ext}`);
    fs.writeFileSync(videoPath, file.buffer);

    // Generate thumbnail via sharp (first frame via ffmpeg is optional; skip for simplicity)
    // Use a placeholder video icon served locally
    const thumbUrl = '/admin/img/video-thumb.png'; // fallback icon

    // Attempt ffmpeg thumbnail generation — silently skip if unavailable
    try {
        const ffmpeg     = require('fluent-ffmpeg');
        const ffmpegPath = require('ffmpeg-static');
        ffmpeg.setFfmpegPath(ffmpegPath);

        const thumbDir  = path.join(UPLOAD_ROOT, businessId, moduleName, 'thumbnails');
        ensureDir(thumbDir);
        const thumbFile = path.join(thumbDir, `${finalName}_thumb.jpg`);

        await new Promise((resolve) => {
            ffmpeg(videoPath)
                .screenshots({ timestamps: ['10%'], filename: `${finalName}_thumb.jpg`, folder: thumbDir, size: '320x240' })
                .on('end', resolve)
                .on('error', resolve); // silently resolve on error
        });

        if (fs.existsSync(thumbFile)) {
            return {
                url:       toPublicUrl(videoPath),
                thumbnail: toPublicUrl(thumbFile),
                width: null, height: null,
                size:  file.buffer.length,
                tags:  ['video', moduleName]
            };
        }
    } catch (_) { /* ffmpeg not available, fall through */ }

    return {
        url:       toPublicUrl(videoPath),
        thumbnail: thumbUrl,
        width: null, height: null,
        size:  file.buffer.length,
        tags:  ['video', moduleName]
    };
}

async function processDocument(file, businessId, moduleName) {
    const hash    = randomHex();
    const docDir  = path.join(UPLOAD_ROOT, businessId, moduleName, 'docs');
    ensureDir(docDir);

    const safeExt  = path.extname(file.originalname) || '.bin';
    const docPath  = path.join(docDir, `${hash}${safeExt}`);
    fs.writeFileSync(docPath, file.buffer);

    return {
        url:       toPublicUrl(docPath),
        thumbnail: null,
        width:     null,
        height:    null,
        size:      file.buffer.length,
        tags:      ['document', moduleName]
    };
}

module.exports = {
    processMedia: async (file, businessId, moduleName) => {
        if (file.mimetype.startsWith('image')) return processImage(file, businessId, moduleName);
        if (file.mimetype.startsWith('video')) return processVideo(file, businessId, moduleName);
        return processDocument(file, businessId, moduleName);
    }
};
