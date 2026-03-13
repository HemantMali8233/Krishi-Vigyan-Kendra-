const Discipline = require('../models/Discipline');
const User = require('../models/User');

const slugify = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
};

// @desc    List disciplines (active only)
// @route   GET /api/disciplines
// @access  Private (any authenticated user)
const listDisciplines = async (req, res) => {
  try {
    const disciplines = await Discipline.find({ isDeleted: { $ne: true } }).sort({ name: 1 });
    res.json(disciplines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List deleted disciplines
// @route   GET /api/disciplines/deleted
// @access  Private/Admin
const listDeletedDisciplines = async (req, res) => {
  try {
    const disciplines = await Discipline.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json(disciplines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create discipline
// @route   POST /api/disciplines
// @access  Private/Admin
const createDiscipline = async (req, res) => {
  try {
    const { name, code, color, description } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Discipline name is required' });
    }

    const finalName = String(name).trim();
    const finalCode = slugify(code || name);
    if (!finalCode) {
      return res.status(400).json({ message: 'Unable to generate discipline code' });
    }

    const existsByCode = await Discipline.findOne({ code: finalCode, isDeleted: { $ne: true } });
    if (existsByCode) {
      return res.status(400).json({ message: 'A discipline with this name or code already exists' });
    }
    const existsByName = await Discipline.findOne({
      name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isDeleted: { $ne: true }
    });
    if (existsByName) {
      return res.status(400).json({ message: 'A discipline with this name already exists' });
    }

    // Check if a deleted discipline exists with the same code
    const deletedByCode = await Discipline.findOne({ code: finalCode, isDeleted: true });
    if (deletedByCode) {
      return res.status(400).json({
        message: `A discipline with this name was previously deleted. Please restore it from "Recently Deleted" if you want to use this name again.`,
        isDeletedConflict: true
      });
    }

    const discipline = await Discipline.create({
      name: finalName,
      code: finalCode,
      color: color || '#567C8D',
      description: description ? String(description).trim() : null
    });

    res.status(201).json(discipline);
  } catch (error) {
    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      // Check if there's a soft-deleted discipline with this code
      const duplicateCode = error.keyValue?.code || error.message.match(/code: "([^"]+)"/)?.[1];
      if (duplicateCode) {
        const deletedDiscipline = await Discipline.findOne({ code: duplicateCode, isDeleted: true });
        if (deletedDiscipline) {
          return res.status(400).json({
            message: `A discipline with this name was previously deleted by an admin. If you want to use this name again, please restore it from the "Recently Deleted" section.`,
            isDeletedConflict: true
          });
        }
      }
      return res.status(400).json({ message: 'A discipline with this name or code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update discipline (name/color only; code is stable)
// @route   PUT /api/disciplines/:id
// @access  Private/Admin
const updateDiscipline = async (req, res) => {
  try {
    const { name, color, description } = req.body || {};

    const discipline = await Discipline.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!discipline) {
      return res.status(404).json({ message: 'Discipline not found' });
    }

    if (name !== undefined) discipline.name = String(name).trim();
    if (color !== undefined) discipline.color = color || '#567C8D';
    if (description !== undefined) discipline.description = description ? String(description).trim() : null;

    await discipline.save();
    res.json(discipline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete discipline (soft delete with reason; requires admin password)
// @route   DELETE /api/disciplines/:id
// @access  Private/Admin
const deleteDiscipline = async (req, res) => {
  try {
    const { reason, adminPassword } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Delete reason is required' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to delete a discipline' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const discipline = await Discipline.findById(req.params.id);
    if (!discipline) {
      return res.status(404).json({ message: 'Discipline not found' });
    }
    if (discipline.isDeleted) {
      return res.status(400).json({ message: 'Discipline is already deleted' });
    }

    discipline.isDeleted = true;
    discipline.deletedAt = new Date();
    discipline.deleteReason = String(reason).trim();
    await discipline.save();
    res.json({ message: 'Discipline deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recover deleted discipline
// @route   PUT /api/disciplines/:id/recover
// @access  Private/Admin
const recoverDiscipline = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to recover a discipline' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const discipline = await Discipline.findById(req.params.id);
    if (!discipline) {
      return res.status(404).json({ message: 'Discipline not found' });
    }
    if (!discipline.isDeleted) {
      return res.status(400).json({ message: 'Discipline is not deleted' });
    }

    discipline.isDeleted = false;
    discipline.deletedAt = null;
    discipline.deleteReason = null;
    await discipline.save();
    res.json({ message: 'Discipline recovered successfully', discipline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete discipline
// @route   DELETE /api/disciplines/:id/permanent
// @access  Private/Admin
const permanentDeleteDiscipline = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to permanently delete a discipline' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const discipline = await Discipline.findById(req.params.id);
    if (!discipline) {
      return res.status(404).json({ message: 'Discipline not found' });
    }

    await Discipline.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discipline permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listDisciplines,
  listDeletedDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  recoverDiscipline,
  permanentDeleteDiscipline
};

