/**
 * Password Validation Utility
 * 
 * Centralized password strength validation for consistent
 * security policy enforcement across the application.
 */

export interface PasswordValidation {
  isValid: boolean;
  reasons: string[];
}

/**
 * Password Strength Validation Function
 * 
 * Enforces application-wide password security requirements:
 * - Minimum 8 characters
 * - At least one number
 * - At least one special character
 * - Cannot be same as email prefix (prevents admin reset reuse)
 * 
 * @param password - The password to validate
 * @param email - User's email (to check against email prefix)
 * @returns Object with validation result and reasons for failure
 */
export const validatePasswordStrength = (password: string, email: string): PasswordValidation => {
  const reasons: string[] = [];
  
  // Ensure we have a valid string (defensive programming)
  const cleanPassword = (password || '').toString().trim();
  
  // Check minimum length requirement
  if (cleanPassword.length < 8) {
    reasons.push('Password must be at least 8 characters long');
  }
  
  // Check for at least one numeric digit
  if (!/\d/.test(cleanPassword)) {
    reasons.push('Password must contain at least one number');
  }
  
  // Check for at least one special character
  // Regex includes most common special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanPassword)) {
    reasons.push('Password must contain at least one special character');
  }
  
  // Security check: prevent using default admin reset passwords
  // Admin resets often use email prefix as temporary password
  const emailPrefix = email.split('@')[0];
  if (cleanPassword === emailPrefix) {
    reasons.push('You must change your password from the default admin-reset password');
  }
  
  return {
    isValid: reasons.length === 0,
    reasons
  };
};