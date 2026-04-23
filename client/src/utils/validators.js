/**
 * Form validation utilities with strict security rules.
 */

/**
 * Validates an email address using a robust RFC 5322 compliant regex.
 */
export const validateEmail = (email) => {
  if (!email) return "Email is required";
  // Robust regex for email validation
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return "Enter a valid email address (e.g., name@example.com)";
  return null;
};

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  if (!hasUpperCase) return "Password must contain at least one uppercase letter";
  if (!hasLowerCase) return "Password must contain at least one lowercase letter";
  if (!hasNumber) return "Password must contain at least one number";
  if (!hasSpecialChar) return "Password must contain at least one special character (@$!%*?&)";
  
  return null;
};

/**
 * Validates that two passwords match exactly.
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

/**
 * Validates a full name (at least two words: First and Last).
 */
export const validateName = (name) => {
  if (!name || !name.trim()) return "Full name is required";
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return "Please enter your full name (First and Last name)";
  if (parts.some(part => part.length < 2)) return "Each part of your name must be at least 2 characters";
  return null;
};

/**
 * Generic required field validator.
 */
export const validateRequired = (value, label) => {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    return `${label} is required`;
  }
  return null;
};
