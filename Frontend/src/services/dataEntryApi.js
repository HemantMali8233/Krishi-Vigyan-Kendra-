const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper to build headers with auth token
const authHeaders = () => {
  const token = sessionStorage.getItem('kvkAuthToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const dataEntryAPI = {
  create: async (record) => {
    const response = await fetch(`${API_URL}/api/data-entry`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(record),
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to create record');
      err.response = { status: response.status };
      throw err;
    }
    return data;
  },

  get: async (year) => {
    const response = await fetch(`${API_URL}/api/data-entry/${year}`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/data-entry/item/${id}`);
    return response.json();
  },

  update: async (id, record) => {
    const response = await fetch(`${API_URL}/api/data-entry/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(record),
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to update record');
      err.response = { status: response.status };
      throw err;
    }
    return data;
  },

  remove: async (id, { adminPassword }) => {
    const response = await fetch(`${API_URL}/api/data-entry/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ adminPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to delete record');
      err.isYearLocked = data.isYearLocked || false;
      err.response = { status: response.status };
      throw err;
    }
    return data;
  },

  bulkImport: async (records, token) => {
    const response = await fetch(`${API_URL}/api/import/bulk-data-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ records }),
    });
    // Handle non-JSON error responses gracefully (e.g. HTML error pages)
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        text
          ? `Import failed (${response.status}): ${text.slice(0, 200)}`
          : `Import failed with status ${response.status}`
      );
    }
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      throw new Error(
        text
          ? `Unexpected response from server: ${text.slice(0, 200)}`
          : 'Unexpected non-JSON response from server during import'
      );
    }
    return response.json();
  },
};
