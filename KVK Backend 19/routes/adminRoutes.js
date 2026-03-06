const express = require('express');
const router = express.Router();
const {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updatePermissions,
  deleteUser,
  unblockUser,
  permanentlyDeleteUser,
  getDashboardStats,
  inactivateUser,
  activateUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/pending-users', getPendingUsers);
router.put('/approve/:id', approveUser);
router.put('/reject/:id', rejectUser);
router.put('/unblock/:id', unblockUser);
router.put('/inactivate/:id', inactivateUser);
router.put('/activate/:id', activateUser);
router.put('/permissions/:id', updatePermissions);
router.delete('/users/:id', deleteUser);
router.delete('/users/:id/permanent', permanentlyDeleteUser);

module.exports = router;
