// src/services/api.js

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

// Generic helper for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('kvkAuthToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    // If response has no JSON, fallback
    if (!response.ok) {
      throw new Error('Something went wrong');
    }
    return {};
  }

  if (!response.ok) {
    // IMPORTANT: use backend message so Login.js can show the correct toast
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth API calls
export const authAPI = {
  // Login user (admin or scientist)
  login: async (email, password, loginType) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, loginType })
    });
  },

  // Register scientist (pending approval) – now with phone
  register: async (name, email, phone, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password })
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET'
    });
  },

  // Get active staff for dropdowns (any role)
  getUsers: async () => {
    return apiRequest('/auth/users', {
      method: 'GET'
    });
  }
};

// Admin API calls
export const adminAPI = {
  // Get dashboard stats
  getStats: async () => {
    return apiRequest('/admin/stats', { method: 'GET' });
  },

  // Get all users
  getAllUsers: async () => {
    return apiRequest('/admin/users', { method: 'GET' });
  },

  // Get pending users
  getPendingUsers: async () => {
    return apiRequest('/admin/pending-users', { method: 'GET' });
  },

  // Approve user
  approveUser: async (userId, data) => {
    return apiRequest(`/admin/approve/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Reject user with reason
  rejectUser: async (userId, reason, adminPassword) => {
    return apiRequest(`/admin/reject/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason, adminPassword })
    });
  },

  // Update user permissions
  updatePermissions: async (userId, data) => {
    return apiRequest(`/admin/permissions/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete user (soft block with reason); adminPassword required
  deleteUser: async (userId, { reason, adminPassword }) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, adminPassword })
    });
  },

  // Inactivate user (keep approved, set isActive=false)
  inactivateUser: async (userId, { reason, adminPassword }) => {
    return apiRequest(`/admin/inactivate/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason, adminPassword })
    });
  },

  // Unblock user; adminPassword required
  unblockUser: async (userId, adminPassword) => {
    return apiRequest(`/admin/unblock/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ adminPassword })
    });
  },

  // Activate user; adminPassword required
  activateUser: async (userId, adminPassword) => {
    return apiRequest(`/admin/activate/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ adminPassword })
    });
  },

  // Permanently delete user
  permanentlyDeleteUser: async (userId) => {
    return apiRequest(`/admin/users/${userId}/permanent`, { method: 'DELETE' });
  }
};

// Discipline API calls
export const disciplineAPI = {
  list: async () => {
    return apiRequest('/disciplines', { method: 'GET' });
  },
  listDeleted: async () => {
    return apiRequest('/disciplines/deleted', { method: 'GET' });
  },
  create: async (data) => {
    return apiRequest('/disciplines', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return apiRequest(`/disciplines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove: async (id, { reason, adminPassword }) => {
    return apiRequest(`/disciplines/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, adminPassword })
    });
  },
  recover: async (id, adminPassword) => {
    return apiRequest(`/disciplines/${id}/recover`, {
      method: 'PUT',
      body: JSON.stringify({ adminPassword })
    });
  },
  permanentDelete: async (id, adminPassword) => {
    return apiRequest(`/disciplines/${id}/permanent`, {
      method: 'DELETE',
      body: JSON.stringify({ adminPassword })
    });
  }
};

// Extension Activity API calls
export const extensionActivityAPI = {
  list: async () => {
    return apiRequest('/extension-activities', { method: 'GET' });
  },
  listDeleted: async () => {
    return apiRequest('/extension-activities/deleted', { method: 'GET' });
  },
  get: async (id) => {
    return apiRequest(`/extension-activities/${id}`, { method: 'GET' });
  },
  create: async (data) => {
    return apiRequest('/extension-activities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return apiRequest(`/extension-activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove: async (id, { reason, adminPassword }) => {
    return apiRequest(`/extension-activities/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, adminPassword })
    });
  },
  recover: async (id, adminPassword) => {
    return apiRequest(`/extension-activities/${id}/recover`, {
      method: 'PUT',
      body: JSON.stringify({ adminPassword })
    });
  },
  permanentDelete: async (id, adminPassword) => {
    return apiRequest(`/extension-activities/${id}/permanent`, {
      method: 'DELETE',
      body: JSON.stringify({ adminPassword })
    });
  }
};

// Training API calls
export const trainingAPI = {
  list: async () => {
    return apiRequest('/trainings', { method: 'GET' });
  },
  listDeleted: async () => {
    return apiRequest('/trainings/deleted', { method: 'GET' });
  },
  get: async (id) => {
    return apiRequest(`/trainings/${id}`, { method: 'GET' });
  },
  create: async (data) => {
    return apiRequest('/trainings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return apiRequest(`/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove: async (id, { reason, adminPassword }) => {
    return apiRequest(`/trainings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, adminPassword })
    });
  },
  recover: async (id, adminPassword) => {
    return apiRequest(`/trainings/${id}/recover`, {
      method: 'PUT',
      body: JSON.stringify({ adminPassword })
    });
  },
  permanentDelete: async (id, adminPassword) => {
    return apiRequest(`/trainings/${id}/permanent`, {
      method: 'DELETE',
      body: JSON.stringify({ adminPassword })
    });
  }
};

export default apiRequest;
