const express = require('express');
const router = express.Router();
const { upload } = require('../utils/upload');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        res.json({
            success: true,
            data: {
                url: req.file.path,
                publicId: req.file.filename,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message,
        });
    }
});

module.exports = router;
