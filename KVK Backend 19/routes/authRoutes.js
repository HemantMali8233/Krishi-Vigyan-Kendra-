// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Get active staff for dropdown selection
router.get('/users', protect, getUsers);

// Update profile (name, email, phone) with password confirmation
router.put('/profile', protect, updateProfile);

// Change / reset password for logged-in user
router.post('/change-password', protect, changePassword);

module.exports = router;
