const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deleteReason: { type: String, trim: true, maxlength: 500, default: null }
  },
  { timestamps: true }
);

trainingSchema.index({ name: 1 });
trainingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Training', trainingSchema);
