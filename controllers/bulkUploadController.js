const Service = require('../models/Service');
const { asyncHandler } = require('../middleware/errorHandler');
const XLSX = require('xlsx');

// @desc    Bulk upload services from Excel or JSON
// @route   POST /api/services/bulk
// @access  Private (Admin only)
const bulkUploadServices = asyncHandler(async (req, res) => {
    const { fileData, fileType } = req.body;

    if (!fileData || !fileType) {
        return res.status(400).json({
            success: false,
            message: 'File data and file type are required'
        });
    }

    let services = [];

    try {
        if (fileType === 'json') {
            // Parse JSON data
            services = typeof fileData === 'string' ? JSON.parse(fileData) : fileData;
        } else if (fileType === 'excel') {
            // Parse Excel data (base64)
            const buffer = Buffer.from(fileData, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Transform Excel data to service format
            services = jsonData.map(row => ({
                title: row.title || row.Title,
                description: row.description || row.Description,
                durationMinutes: parseInt(row.durationMinutes || row['Duration (Minutes)']) || 30,
                duration: row.duration || row.Duration,
                priceINR: parseFloat(row.priceINR || row['Price (INR)']) || 0,
                location: row.location || row.Location,
                pujaLanguage: row.pujaLanguage || row.Language || row.language,
                category: row.category || row.Category,
                difficulty: row.difficulty || row.Difficulty || 'Easy',
                panditDetails: row.panditDetails || row['Pandit Details'] || '',
                benefits: row.benefits ? (typeof row.benefits === 'string' ? row.benefits.split('|').map(b => b.trim()) : row.benefits) : [],
                materials: row.materials ? (typeof row.materials === 'string' ? row.materials.split('|').map(m => m.trim()) : row.materials) : [],
                procedure: row.procedure ? (typeof row.procedure === 'string' ? row.procedure.split('|').map(p => p.trim()) : row.procedure) : [],
                included: row.included ? (typeof row.included === 'string' ? row.included.split('|').map(i => i.trim()) : row.included) : [],
                excluded: row.excluded ? (typeof row.excluded === 'string' ? row.excluded.split('|').map(e => e.trim()) : row.excluded) : [],
                images: row.image ? [row.image] : (row.images ? (typeof row.images === 'string' ? row.images.split('|').map(img => img.trim()) : row.images) : []),
                isActive: row.isActive !== undefined ? row.isActive : true
            }));
        } else {
            return res.status(400).json({
                success: false,
                message: 'Unsupported file type. Use json or excel'
            });
        }

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid services found in file'
            });
        }

        // Add createdBy and updatedBy to each service
        const servicesWithUser = services.map(service => ({
            ...service,
            createdBy: req.user.id,
            updatedBy: req.user.id
        }));

        // Validate and create services
        const results = {
            success: [],
            errors: []
        };

        for (let i = 0; i < servicesWithUser.length; i++) {
            try {
                const service = await Service.create(servicesWithUser[i]);
                results.success.push({
                    index: i + 1,
                    title: service.title,
                    id: service._id
                });
            } catch (error) {
                results.errors.push({
                    index: i + 1,
                    title: servicesWithUser[i].title || 'Unknown',
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk upload completed. ${results.success.length} services created, ${results.errors.length} errors`,
            data: {
                created: results.success.length,
                failed: results.errors.length,
                results
            }
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to process file'
        });
    }
});

module.exports = {
    bulkUploadServices
};
