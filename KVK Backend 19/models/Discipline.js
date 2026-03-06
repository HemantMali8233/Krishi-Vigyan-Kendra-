const mongoose = require('mongoose');

// Disciplines are admin-managed and used across:
// - user.primary discipline
// - user.assignedDisciplines (multi-discipline access)
// - permissions map keys (disciplineCode -> permission array)
//
// `code` is a stable slug used as identifier in permissions.
const disciplineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true },
    color: { type: String, default: '#567C8D', trim: true },
    description: { type: String, trim: true, maxlength: 500, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deleteReason: { type: String, trim: true, maxlength: 500, default: null }
  },
  { timestamps: true }
);

disciplineSchema.index({ name: 1 });

module.exports = mongoose.model('Discipline', disciplineSchema);

