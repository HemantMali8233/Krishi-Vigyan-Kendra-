const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const dataEntryAPI = {
  create: async (record) => {
    const response = await fetch(`${API_URL}/api/data-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return response.json();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return response.json();
  },

  remove: async (id, { adminPassword }) => {
    const response = await fetch(`${API_URL}/api/data-entry/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword }),
    });
    return response.json();
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
    return response.json();
  },
};
