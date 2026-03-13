const express = require('express');
const router = express.Router();
const { getAllYearLocks, lockYear, unlockYear } = require('../controllers/yearLockController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all year locks
router.get('/', protect, getAllYearLocks);

// Lock a year
router.put('/:year/lock', protect, adminOnly, lockYear);

// Unlock a year
router.put('/:year/unlock', protect, adminOnly, unlockYear);

module.exports = router;
