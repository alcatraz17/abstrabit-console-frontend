import { ApiError, apiRequest } from './client.js';

export const authApi = {
  async me(signal) {
    try {
      const { admin } = await apiRequest('/auth/me', { signal });
      return admin;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  async login(credentials) {
    const { admin } = await apiRequest('/auth/login', { method: 'POST', body: credentials });
    return admin;
  },
  logout() {
    return apiRequest('/auth/logout', { method: 'POST' });
  },
};
