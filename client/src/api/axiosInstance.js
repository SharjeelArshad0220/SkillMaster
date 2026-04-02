import axios from "axios";
import { getToken, clearToken } from "../utils/tokenHelpers";

const api = axios.create({
  // Use environment variable or fallback to localhost
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor: Attach JWT token to every request if it exists.
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle global errors like 401 Unauthorized.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401, the token is invalid or expired
    if (error.response?.status === 401) {
      clearToken();
      localStorage.removeItem("sm_user");
      // Optional: Redirect to login if not already there
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
