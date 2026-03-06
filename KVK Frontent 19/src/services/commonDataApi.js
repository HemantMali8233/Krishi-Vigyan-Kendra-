const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const commonDataAPI = {
  get: async (type) => {
    const response = await fetch(`${API_URL}/api/common-data/${type}`);
    return response.json();
  },
  add: async (type, value) => {
    const response = await fetch(`${API_URL}/api/common-data/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return response.json();
  },
};
