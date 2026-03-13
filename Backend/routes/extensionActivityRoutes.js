const express = require('express');
const router = express.Router();

const {
  listExtensionActivities,
  listDeletedExtensionActivities,
  getExtensionActivity,
  createExtensionActivity,
  updateExtensionActivity,
  deleteExtensionActivity,
  recoverExtensionActivity,
  permanentDeleteExtensionActivity
} = require('../controllers/extensionActivityController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Any authenticated user can list/view extension activities
router.get('/', protect, listExtensionActivities);
router.get('/deleted', protect, adminOnly, listDeletedExtensionActivities);
router.get('/:id', protect, getExtensionActivity);

// Admin CRUD
router.post('/', protect, adminOnly, createExtensionActivity);
router.put('/:id', protect, adminOnly, updateExtensionActivity);
router.put('/:id/recover', protect, adminOnly, recoverExtensionActivity);
router.delete('/:id', protect, adminOnly, deleteExtensionActivity);
router.delete('/:id/permanent', protect, adminOnly, permanentDeleteExtensionActivity);

module.exports = router;
