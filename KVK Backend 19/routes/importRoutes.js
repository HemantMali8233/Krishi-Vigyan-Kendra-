const express = require('express');
const router = express.Router();
const { bulkImportDataEntry } = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/import/bulk-data-entry
// @desc    Bulk import data entry records from Excel
// @access  Private (Authenticated users only)
router.post('/bulk-data-entry', protect, bulkImportDataEntry);

module.exports = router;
