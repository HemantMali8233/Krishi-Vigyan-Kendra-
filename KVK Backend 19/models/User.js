// models/User.js - ✅ FINAL VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'program_assistant', 'scientist'];  // ✅ NO program_coordinator
const GENDERS = ['male', 'female', 'other'];
const STATUSES = ['pending', 'approved', 'rejected'];
const PHONE_REGEX = /^[6-9]\d{9}$/;

const userSchema = new mongoose.Schema(
  {
    // Basic info (signup)
    name: { type: String, required: [true, 'Please add a name'], trim: true },
    email: { 
      type: String, 
      required: [true, 'Please add an email'], 
      unique: true, 
      lowercase: true, 
      trim: true, 
      match: [/^\S+@\S+\.\S+$/, 'Please add a valid email']
    },
    phone: { 
      type: String, 
      required: [true, 'Please add a phone number'], 
      trim: true, 
      validate: {
        validator: v => PHONE_REGEX.test(v),
        message: 'Valid 10-digit mobile number starting with 6–9'
      }
    },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },

    // User-editable (optional)
    gender: { type: String, enum: GENDERS, default: null },
    dateOfBirth: { type: Date, default: null },

    // ✅ Admin-managed primary discipline (matches Discipline.code)
    discipline: { type: String, trim: true, lowercase: true, default: null },

    // Admin-managed (other fields)
    role: { type: String, enum: ROLES, default: 'program_assistant', required: true },
    designation: { type: String, trim: true, maxlength: 100, default: null },
    joiningDate: { type: Date, default: null },
    
    isActive: { type: Boolean, default: false },
    status: { type: String, enum: STATUSES, default: 'pending' },
    blockReason: { type: String, trim: true, maxlength: 500, default: null },
    dataEntryEnabled: { type: Boolean, default: false },

    // Multiple disciplines array (stores Discipline.code values)
    assignedDisciplines: [{ type: String, trim: true, lowercase: true }],
    permissions: {
      type: Map,
      of: [{ type: String, enum: ['create', 'view', 'update', 'delete', 'data_entry', 'import', 'export'] }],
      default: {}
    }
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, status: 1, isActive: 1 });
userSchema.index({ discipline: 1 });

// Password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
