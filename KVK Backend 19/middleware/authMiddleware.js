const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Check if user has permission for a discipline
const checkDisciplineAccess = (discipline) => {
  return (req, res, next) => {
    // Admin has access to all disciplines
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if scientist has access to this discipline
    if (req.user.assignedDisciplines && req.user.assignedDisciplines.includes(discipline)) {
      return next();
    }

    res.status(403).json({ message: `Access denied. You don't have permission for ${discipline}.` });
  };
};

// Check specific permission for a discipline
const checkPermission = (discipline, permission) => {
  return (req, res, next) => {
    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if scientist has the specific permission
    const userPermissions = req.user.permissions?.get(discipline) || [];
    
    if (userPermissions.includes(permission)) {
      return next();
    }

    res.status(403).json({ 
      message: `Access denied. You don't have ${permission} permission for ${discipline}.` 
    });
  };
};

module.exports = { protect, adminOnly, checkDisciplineAccess, checkPermission };
