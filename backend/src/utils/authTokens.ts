/**
 * Authentication Token Utilities
 * 
 * Centralized JWT token generation and validation utilities
 * for consistent authentication token handling.
 */

import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate JWT Token
 * 
 * Creates a signed JWT token with user information for authentication.
 * Token expires in 24 hours and uses environment-configured secret.
 * 
 * @param payload - User information to encode in token
 * @returns Signed JWT token string
 */
export const generateJWTToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '24h' }
  );
};

/**
 * Verify JWT Token
 * 
 * Validates and decodes a JWT token to extract user information.
 * Throws an error if the token is invalid or expired.
 * 
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyJWTToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as TokenPayload;
};