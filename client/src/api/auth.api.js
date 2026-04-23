import api from './axiosInstance';

/**
 * Creates a new user account.
 * POST /auth/signup
 */
export const signupUser = async (name, email, password) => {
  const res = await api.post('/auth/signup', { name, email, password });
  return res.data;
};

/**
 * Authenticates existing user.
 * POST /auth/login
 */
export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

/**
 * Validates token and gets current user info.
 * GET /auth/me
 */
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
