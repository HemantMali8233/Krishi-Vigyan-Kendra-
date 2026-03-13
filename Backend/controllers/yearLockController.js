const YearLock = require('../models/YearLock');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all year locks
// @route   GET /api/year-lock
// @access  Private
const getAllYearLocks = async (req, res) => {
  try {
    const locks = await YearLock.find().lean();
    res.json(locks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lock a specific year
// @route   PUT /api/year-lock/:year/lock
// @access  Private/Admin
const lockYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to lock the year' });
    }

    // Verify admin password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect admin password. Cannot lock the year.' });
    }

    // Lock the year
    const lock = await YearLock.findOneAndUpdate(
      { year: parseInt(year, 10) },
      { 
        isLocked: true, 
        lockedBy: req.user._id,
        lockedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Year ${year} has been locked successfully.`, lock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlock a specific year
// @route   PUT /api/year-lock/:year/unlock
// @access  Private/Admin
const unlockYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to unlock the year' });
    }

    // Verify admin password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect admin password. Cannot unlock the year.' });
    }

    // Unlock the year
    const lock = await YearLock.findOneAndUpdate(
      { year: parseInt(year, 10) },
      { 
        isLocked: false,
        lockedBy: req.user._id,
        lockedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Year ${year} has been unlocked successfully.`, lock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllYearLocks,
  lockYear,
  unlockYear
};
