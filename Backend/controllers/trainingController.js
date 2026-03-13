const Training = require('../models/Training');
const User = require('../models/User');

// @desc    List trainings (active only)
// @route   GET /api/trainings
// @access  Private (any authenticated user)
const listTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single training
// @route   GET /api/trainings/:id
// @access  Private
const getTraining = async (req, res) => {
  try {
    const training = await Training.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }
    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create training
// @route   POST /api/trainings
// @access  Private/Admin
const createTraining = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Training name is required' });
    }

    const finalName = String(name).trim();

    // Check for duplicate name
    const existsByName = await Training.findOne({
      name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isDeleted: { $ne: true }
    });
    if (existsByName) {
      return res.status(400).json({ message: 'A training with this name already exists' });
    }

    const training = await Training.create({
      name: finalName,
      description: description ? String(description).trim() : null
    });

    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update training
// @route   PUT /api/trainings/:id
// @access  Private/Admin
const updateTraining = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    const training = await Training.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    if (name !== undefined) {
      const finalName = String(name).trim();
      // Check for duplicate name (excluding current)
      const existsByName = await Training.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        isDeleted: { $ne: true }
      });
      if (existsByName) {
        return res.status(400).json({ message: 'A training with this name already exists' });
      }
      training.name = finalName;
    }
    if (description !== undefined) {
      training.description = description ? String(description).trim() : null;
    }

    await training.save();
    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List deleted trainings
// @route   GET /api/trainings/deleted
// @access  Private/Admin
const listDeletedTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ isDeleted: true })
      .sort({ deletedAt: -1 });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recover deleted training
// @route   PUT /api/trainings/:id/recover
// @access  Private/Admin
const recoverTraining = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to recover a training' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }
    if (!training.isDeleted) {
      return res.status(400).json({ message: 'Training is not deleted' });
    }

    training.isDeleted = false;
    training.deletedAt = null;
    training.deleteReason = null;
    await training.save();
    res.json({ message: 'Training recovered successfully', training });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete training
// @route   DELETE /api/trainings/:id/permanent
// @access  Private/Admin
const permanentDeleteTraining = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to permanently delete a training' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    await Training.findByIdAndDelete(req.params.id);
    res.json({ message: 'Training permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete training (soft delete)
// @route   DELETE /api/trainings/:id
// @access  Private/Admin
const deleteTraining = async (req, res) => {
  try {
    const { reason, adminPassword } = req.body || {};

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Delete reason is required' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required' });
    }

    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }
    if (training.isDeleted) {
      return res.status(400).json({ message: 'Training is already deleted' });
    }

    training.isDeleted = true;
    training.deletedAt = new Date();
    training.deleteReason = String(reason).trim();
    await training.save();

    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listTrainings,
  listDeletedTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  recoverTraining,
  permanentDeleteTraining
};
