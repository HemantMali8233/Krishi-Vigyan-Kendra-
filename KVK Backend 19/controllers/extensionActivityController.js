const ExtensionActivity = require('../models/ExtensionActivity');
const User = require('../models/User');

// @desc    List extension activities (active only)
// @route   GET /api/extension-activities
// @access  Private (any authenticated user)
const listExtensionActivities = async (req, res) => {
  try {
    const activities = await ExtensionActivity.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single extension activity
// @route   GET /api/extension-activities/:id
// @access  Private
const getExtensionActivity = async (req, res) => {
  try {
    const activity = await ExtensionActivity.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });
    if (!activity) {
      return res.status(404).json({ message: 'Extension activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create extension activity
// @route   POST /api/extension-activities
// @access  Private/Admin
const createExtensionActivity = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Activity name is required' });
    }

    const finalName = String(name).trim();

    // Check for duplicate name
    const existsByName = await ExtensionActivity.findOne({
      name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isDeleted: { $ne: true }
    });
    if (existsByName) {
      return res.status(400).json({ message: 'An extension activity with this name already exists' });
    }

    const activity = await ExtensionActivity.create({
      name: finalName,
      description: description ? String(description).trim() : null
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update extension activity
// @route   PUT /api/extension-activities/:id
// @access  Private/Admin
const updateExtensionActivity = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    const activity = await ExtensionActivity.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });
    if (!activity) {
      return res.status(404).json({ message: 'Extension activity not found' });
    }

    if (name !== undefined) {
      const finalName = String(name).trim();
      // Check for duplicate name (excluding current)
      const existsByName = await ExtensionActivity.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        isDeleted: { $ne: true }
      });
      if (existsByName) {
        return res.status(400).json({ message: 'An extension activity with this name already exists' });
      }
      activity.name = finalName;
    }
    if (description !== undefined) {
      activity.description = description ? String(description).trim() : null;
    }

    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List deleted extension activities
// @route   GET /api/extension-activities/deleted
// @access  Private/Admin
const listDeletedExtensionActivities = async (req, res) => {
  try {
    const activities = await ExtensionActivity.find({ isDeleted: true })
      .sort({ deletedAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recover deleted extension activity
// @route   PUT /api/extension-activities/:id/recover
// @access  Private/Admin
const recoverExtensionActivity = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to recover an activity' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const activity = await ExtensionActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Extension activity not found' });
    }
    if (!activity.isDeleted) {
      return res.status(400).json({ message: 'Activity is not deleted' });
    }

    activity.isDeleted = false;
    activity.deletedAt = null;
    activity.deleteReason = null;
    await activity.save();
    res.json({ message: 'Extension activity recovered successfully', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete extension activity
// @route   DELETE /api/extension-activities/:id/permanent
// @access  Private/Admin
const permanentDeleteExtensionActivity = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to permanently delete an activity' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const activity = await ExtensionActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Extension activity not found' });
    }

    await ExtensionActivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Extension activity permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete extension activity (soft delete)
// @route   DELETE /api/extension-activities/:id
// @access  Private/Admin
const deleteExtensionActivity = async (req, res) => {
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

    const activity = await ExtensionActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Extension activity not found' });
    }
    if (activity.isDeleted) {
      return res.status(400).json({ message: 'Activity is already deleted' });
    }

    activity.isDeleted = true;
    activity.deletedAt = new Date();
    activity.deleteReason = String(reason).trim();
    await activity.save();

    res.json({ message: 'Extension activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listExtensionActivities,
  listDeletedExtensionActivities,
  getExtensionActivity,
  createExtensionActivity,
  updateExtensionActivity,
  deleteExtensionActivity,
  recoverExtensionActivity,
  permanentDeleteExtensionActivity
};
