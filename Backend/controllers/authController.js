// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user (Program Coordinator/Assistant)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide name, email, phone and password' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      if (userExists.status === 'rejected') {
        userExists.name = name;
        userExists.phone = phone;
        userExists.password = password;
        userExists.status = 'pending';
        userExists.isActive = false;
        userExists.blockReason = null;
        await userExists.save();
        return res.status(200).json({
          success: true,
          message: 'Registration successful! Please wait for admin approval.',
          user: {
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            phone: userExists.phone,
            status: userExists.status,
            isActive: userExists.isActive
          }
        });
      }
      return res
        .status(400)
        .json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      status: 'pending',  // Updated: default is pending
      isActive: false     // Updated: default is inactive
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please wait for admin approval.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res
      .status(500)
      .json({ message: 'Server error during registration' });
  }
};

// @desc    Login user (Admin or Approved/Active Staff)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;  // Removed loginType - unified login

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    // case: email not found
    if (!user) {
      return res
        .status(401)
        .json({ message: 'No account found with this email' });
    }

    const isMatch = await user.matchPassword(password);

    // case: password incorrect
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Status checks for non-admin users
    if (user.role !== 'admin') {
      if (user.status === 'pending') {
        return res.status(403).json({
          message: 'Your account is pending approval. Please wait for admin to approve.',
          status: 'pending'
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          message: 'Your request has been rejected by the admin please register again',
          status: 'rejected'
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          message: 'Your account is currently inactive. Please contact admin.',
          status: 'inactive'
        });
      }
    }

    // Convert permissions Map to plain object
    const permissionsObj = {};
    if (user.permissions) {
      user.permissions.forEach((value, key) => {
        permissionsObj[key] = Array.isArray(value) ? value : [value];
      });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      designation: user.designation,
      dataEntryEnabled: user.dataEntryEnabled,
      status: user.status,
      isActive: user.isActive,
      gender: user.gender,
      assignedDisciplines: user.assignedDisciplines || [],
      permissions: permissionsObj,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert permissions Map to plain object
    const permissionsObj = {};
    if (user.permissions) {
      user.permissions.forEach((value, key) => {
        permissionsObj[key] = Array.isArray(value) ? value : [value];
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      // ✅ NEW: Discipline field
      discipline: user.discipline,
      role: user.role,
      designation: user.designation,
      dataEntryEnabled: user.dataEntryEnabled,
      status: user.status,
      isActive: user.isActive,
      joiningDate: user.joiningDate,
      assignedDisciplines: user.assignedDisciplines || [],
      permissions: permissionsObj,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update current user's profile (only basic info + profile completion)
// @route   PUT /api/auth/profile
// @access  Private
// controllers/authController.js - updateProfile ONLY
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, gender, dateOfBirth, currentPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((name || email || phone) && !currentPassword) {
      return res.status(400).json({ message: 'Current password required for basic info update' });
    }

    if (currentPassword && (name || email || phone)) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender || null;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;

    await user.save();

    const permissionsObj = {};
    if (user.permissions) {
      user.permissions.forEach((value, key) => {
        permissionsObj[key] = Array.isArray(value) ? value : [value];
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        discipline: user.discipline,  // ✅ NEW
        role: user.role,
        designation: user.designation,
        status: user.status,
        isActive: user.isActive,
        joiningDate: user.joiningDate,
        assignedDisciplines: user.assignedDisciplines || [],
        permissions: permissionsObj
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// @desc    Change current user's password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Set new password; pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res
      .status(500)
      .json({ message: 'Server error while changing password' });
  }
};

// @desc    Get all active users for dropdowns
// @route   GET /api/auth/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true, role: { $ne: 'admin' } })
      .select('name designation discipline phone mobile email')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getUsers
};
