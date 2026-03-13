const mongoose = require('mongoose');

const YearLockSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('YearLock', YearLockSchema);
