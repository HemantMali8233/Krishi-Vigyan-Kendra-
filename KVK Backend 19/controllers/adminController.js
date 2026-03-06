const User = require('../models/User');

const ALLOWED_ROLE_VALUES = ['admin', 'scientist', 'program_assistant'];
const ALLOWED_PERMISSION_VALUES = ['create', 'view', 'update', 'delete', 'data_entry', 'import'];

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);
};

const sanitizePermissionsObject = (permissionsObj = {}, allowedDisciplines = []) => {
  const out = {};
  const allowedSet = new Set(allowedDisciplines);

  Object.entries(permissionsObj || {}).forEach(([disciplineCode, perms]) => {
    const key = String(disciplineCode || '').trim().toLowerCase();
    if (!key || !allowedSet.has(key)) return;

    const cleaned = Array.from(
      new Set(
        (Array.isArray(perms) ? perms : [])
          .map((p) => String(p || '').trim().toLowerCase())
          .filter((p) => ALLOWED_PERMISSION_VALUES.includes(p))
      )
    );
    out[key] = cleaned;
  });

  // Ensure every assigned discipline has a key (even if empty)
  allowedDisciplines.forEach((d) => {
    if (!out[d]) out[d] = [];
  });

  return out;
};

// @desc    Get all pending users (for approval)
// @route   GET /api/admin/pending-users
// @access  Private/Admin
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending', role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/approve/:id
// @access  Private/Admin
const approveUser = async (req, res) => {
  try {
    const {
      discipline,
      role,
      designation,
      joiningDate,
      isActive,
      assignedDisciplines,
      permissions,
      adminPassword,
      dataEntryEnabled
    } = req.body || {};

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin user' });
    }

    const nextRole = role ? String(role).trim().toLowerCase() : user.role;
    if (nextRole && !ALLOWED_ROLE_VALUES.includes(nextRole)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const primaryDiscipline = discipline ? String(discipline).trim().toLowerCase() : null;
    if (nextRole === 'scientist' && !primaryDiscipline) {
      return res.status(400).json({ message: 'Primary discipline is required' });
    }

    const finalDesignation = designation !== undefined ? String(designation || '').trim() : null;
    // Designation is optional for admin role
    if (nextRole !== 'admin' && !finalDesignation) {
      return res.status(400).json({ message: 'Designation is required' });
    }

    const finalJoiningDate = joiningDate ? new Date(joiningDate) : null;
    // Joining date is optional
    if (finalJoiningDate && Number.isNaN(finalJoiningDate.getTime())) {
      return res.status(400).json({ message: 'Invalid joining date format' });
    }

    const activeFlag = Boolean(isActive);
    if (!activeFlag) {
      return res.status(400).json({
        message:
          'User must be set Active during approval (inactive users cannot login).'
      });
    }

    // Admin password confirmation when granting admin role
    if (nextRole === 'admin') {
      const admin = await User.findById(req.user._id).select('+password');
      if (!admin) {
        return res.status(401).json({ message: 'Admin session invalid' });
      }
      const ok = await admin.matchPassword(String(adminPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Admin password confirmation failed' });
      }
    }

    // Assigned disciplines must include the primary discipline
    const normalizedAssigned = normalizeStringArray(assignedDisciplines);
    const disciplinesSet = new Set(normalizedAssigned);
    if (primaryDiscipline) {
      disciplinesSet.add(primaryDiscipline);
    }
    const finalAssigned = Array.from(disciplinesSet);

    user.status = 'approved';
    user.isActive = activeFlag;
    user.role = nextRole || user.role;
    user.discipline = nextRole === 'admin' ? null : primaryDiscipline;
    user.designation = finalDesignation;
    user.joiningDate = finalJoiningDate;
    user.assignedDisciplines = nextRole === 'admin' ? [] : finalAssigned;
    user.dataEntryEnabled = nextRole === 'admin' ? false : Boolean(dataEntryEnabled);
    
    // Set permissions
    if (nextRole === 'admin') {
      user.permissions = new Map();
    } else {
      const cleanedPermissionsObj = sanitizePermissionsObject(permissions || {}, finalAssigned);
      user.permissions = new Map(Object.entries(cleanedPermissionsObj));
    }

    await user.save();

    res.json({
      message: 'User approved successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        discipline: user.discipline,
        joiningDate: user.joiningDate,
        isActive: user.isActive,
        status: user.status,
        assignedDisciplines: user.assignedDisciplines,
        dataEntryEnabled: user.dataEntryEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject user
// @route   PUT /api/admin/reject/:id
// @access  Private/Admin
const rejectUser = async (req, res) => {
  try {
    const { reason, adminPassword } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Reject reason is required' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to reject a user' });
    }

    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin user' });
    }

    user.status = 'rejected';
    user.isActive = false;
    user.blockReason = String(reason).trim();
    await user.save();

    res.json({
      message: 'User rejected',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user permissions and profile
// @route   PUT /api/admin/permissions/:id
// @access  Private/Admin
const updatePermissions = async (req, res) => {
  try {
    const {
      role,
      discipline,
      designation,
      joiningDate,
      assignedDisciplines,
      permissions,
      isActive,
      adminPassword,
      dataEntryEnabled
    } = req.body || {};

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin permissions' });
    }

    // Update role if provided (with admin password check)
    if (role && role !== user.role) {
      const nextRole = String(role).trim().toLowerCase();
      if (!ALLOWED_ROLE_VALUES.includes(nextRole)) {
        return res.status(400).json({ message: 'Invalid role value' });
      }
      if (nextRole === 'admin') {
        const admin = await User.findById(req.user._id).select('+password');
        if (!admin) {
          return res.status(401).json({ message: 'Admin session invalid' });
        }
        const ok = await admin.matchPassword(String(adminPassword || ''));
        if (!ok) {
          return res.status(401).json({ message: 'Admin password confirmation failed' });
        }
      }
      user.role = nextRole;
    }

    // Update discipline if provided
    if (discipline !== undefined) {
      const primaryDiscipline = discipline ? String(discipline).trim().toLowerCase() : null;
      if (primaryDiscipline) {
        user.discipline = primaryDiscipline;
      }
    }

    // Update designation if provided
    if (designation !== undefined) {
      user.designation = designation ? String(designation).trim() : null;
    }

    // Update joining date if provided
    if (joiningDate !== undefined) {
      const finalJoiningDate = joiningDate ? new Date(joiningDate) : null;
      if (finalJoiningDate && !Number.isNaN(finalJoiningDate.getTime())) {
        user.joiningDate = finalJoiningDate;
      }
    }

    // Update assigned disciplines
    const normalizedAssigned =
      assignedDisciplines !== undefined
        ? normalizeStringArray(assignedDisciplines)
        : user.assignedDisciplines || [];
    if (assignedDisciplines !== undefined) {
      // Ensure primary discipline is included
      if (user.discipline && !normalizedAssigned.includes(user.discipline)) {
        normalizedAssigned.push(user.discipline);
      }
      user.assignedDisciplines = normalizedAssigned;
    }

    // Update active status
    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    // Update global data entry flag
    if (dataEntryEnabled !== undefined) {
      user.dataEntryEnabled = Boolean(dataEntryEnabled);
    }

    // Update permissions
    if (permissions) {
      const cleaned = sanitizePermissionsObject(permissions, user.assignedDisciplines || normalizedAssigned);
      user.permissions = new Map(Object.entries(cleaned));
    }

    await user.save();

    // Convert Map to object for response
    const permissionsObj = {};
    if (user.permissions) {
      user.permissions.forEach((value, key) => {
        permissionsObj[key] = Array.isArray(value) ? value : [value];
      });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        discipline: user.discipline,
        joiningDate: user.joiningDate,
        isActive: user.isActive,
        status: user.status,
        assignedDisciplines: user.assignedDisciplines || [],
        permissions: permissionsObj,
        dataEntryEnabled: user.dataEntryEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (soft block with reason)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { reason, adminPassword } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Delete reason is required to block a user' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to block a user' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Soft block instead of hard delete (moves user to "blocked" list)
    user.status = 'rejected';
    user.isActive = false;
    user.blockReason = String(reason).trim();
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock user
// @route   PUT /api/admin/unblock/:id
// @access  Private/Admin
const unblockUser = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to unblock a user' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin user' });
    }

    user.status = 'pending';
    user.blockReason = null;
    await user.save();

    // Convert permissions Map to object for response
    const permissionsObj = {};
    if (user.permissions) {
      user.permissions.forEach((value, key) => {
        permissionsObj[key] = Array.isArray(value) ? value : [value];
      });
    }

    res.json({
      message: 'User unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        discipline: user.discipline,
        joiningDate: user.joiningDate,
        isActive: user.isActive,
        status: user.status,
        assignedDisciplines: user.assignedDisciplines || [],
        permissions: permissionsObj
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Inactivate user (keep approved status, set isActive=false) with reason
// @route   PUT /api/admin/inactivate/:id
// @access  Private/Admin
const inactivateUser = async (req, res) => {
  try {
    const { reason, adminPassword } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Inactivation reason is required' });
    }
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to inactivate a user' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin user' });
    }

    user.isActive = false;
    if (user.status !== 'approved') {
      user.status = 'approved';
    }
    user.blockReason = String(reason).trim();
    await user.save();

    res.json({
      message: 'User set to inactive',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        discipline: user.discipline,
        isActive: user.isActive,
        status: user.status,
        blockReason: user.blockReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activate user (set isActive=true) with admin password
// @route   PUT /api/admin/activate/:id
// @access  Private/Admin
const activateUser = async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (!adminPassword || !String(adminPassword).trim()) {
      return res.status(400).json({ message: 'Admin password is required to activate a user' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin session invalid' });
    }
    const ok = await admin.matchPassword(String(adminPassword).trim());
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin user' });
    }

    user.isActive = true;
    if (user.status !== 'approved') {
      user.status = 'approved';
    }
    user.blockReason = null;
    await user.save();

    res.json({
      message: 'User activated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete user
// @route   DELETE /api/admin/users/:id/permanent
// @access  Private/Admin
const permanentlyDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const nonAdminFilter = { role: { $ne: 'admin' } };
    const totalUsers = await User.countDocuments(nonAdminFilter);
    const pendingUsers = await User.countDocuments({ ...nonAdminFilter, status: 'pending' });
    const approvedUsers = await User.countDocuments({ ...nonAdminFilter, status: 'approved' });
    const rejectedUsers = await User.countDocuments({ ...nonAdminFilter, status: 'rejected' });

    res.json({
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updatePermissions,
  deleteUser,
  unblockUser,
  inactivateUser,
  activateUser,
  permanentlyDeleteUser,
  getDashboardStats
};
