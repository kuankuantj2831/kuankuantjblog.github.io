const express = require('express');
const router = express.Router();
const multer = require('multer');
const COS = require('cos-nodejs-sdk-v5');
const { pool } = require('../db');

// Use memory storage for processing before upload to COS
// Limit file size to 50MB to avoid memory issues (Node.js/SCF limits)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize COS
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
});

const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

// Helper to check if COS is configured
const checkCOSConfig = (req, res, next) => {
    if (!process.env.COS_SECRET_ID || !process.env.COS_BUCKET) {
        return res.status(500).json({ message: 'Server COS configuration missing' });
    }
    next();
};

// Helper to fix Chinese filename encoding (latin1 -> utf8)
const fixEncoding = (name) => {
    try {
        return Buffer.from(name, 'latin1').toString('utf8');
    } catch (e) {
        return name;
    }
};

// GET /list - List files in bucket
router.get('/list', checkCOSConfig, (req, res) => {
    // Optional: Add prefix support for folders
    const prefix = req.query.prefix || '';

    cos.getBucket({
        Bucket: BUCKET,
        Region: REGION,
        Prefix: prefix,
        Delimiter: '/', // Folders
    }, (err, data) => {
        if (err) {
            console.error('COS List Error:', err);
            return res.status(500).json({ message: 'Failed to list files', error: err.message });
        }

        // Transform data for frontend
        const files = (data.Contents || []).map(item => ({
            key: item.Key,
            name: item.Key.split('/').pop(),
            size: item.Size,
            lastModified: item.LastModified,
            type: 'file'
        }));

        const folders = (data.CommonPrefixes || []).map(item => ({
            key: item.Prefix,
            name: item.Prefix.split('/').slice(-2)[0], // Get folder name
            type: 'folder'
        }));

        res.json({ files: [...folders, ...files] });
    });
});

// POST /upload - Upload file to COS
router.post('/upload', checkCOSConfig, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    // Fix Chinese characters garbled issue
    const originalName = fixEncoding(req.file.originalname);
    const key = originalName;

    cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: req.file.buffer, // Buffer from multer
        ContentLength: req.file.size
    }, (err, data) => {
        if (err) {
            console.error('COS Upload Error:', err);
            return res.status(500).json({ message: 'Failed to upload to COS', error: err.message });
        }
        res.json({ message: 'Upload successful', url: `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}` });
    });
});

// GET /download/:key - Get signed URL (Redirect or JSON)
router.get('/download', checkCOSConfig, (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ message: 'Missing file key' });

    // Generate Pre-Signed URL for security (valid for 10 mins)
    cos.getObjectUrl({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Sign: true,
        Expires: 600,
    }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error generating link' });
        }
        // Redirect user to the COS link directly
        // res.redirect(data.Url); 
        // OR return JSON
        res.json({ url: data.Url });
    });
});

// DELETE /delete - Delete file
router.post('/delete', checkCOSConfig, (req, res) => {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid file key' });
    }

    // 防止路径遍历攻击
    if (key.includes('..') || key.startsWith('/')) {
        return res.status(400).json({ message: 'Invalid file key' });
    }

    cos.deleteObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: key
    }, (err, data) => {
        if (err) {
            console.error('COS Delete Error:', err);
            return res.status(500).json({ message: 'Delete failed', error: err.message });
        }
        res.json({ message: 'Deleted successfully' });
    });
});

module.exports = router;
