/**
 * Utility helpers for JWT management in localStorage.
 */

const TOKEN_KEY = "sm_token";

/**
 * Saves the JWT to localStorage.
 * @param {string} token 
 */
export const saveToken = (token) => {
  if (token && typeof token === "string") {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieves the JWT from localStorage.
 * @returns {string | null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Removes the JWT from localStorage.
 */
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
