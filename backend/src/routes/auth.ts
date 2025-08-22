/**
 * Authentication and User Management Routes
 * 
 * This module handles all authentication-related API endpoints including:
 * - User login with password validation
 * - JWT token verification and management
 * - Admin user management (create, read, update, delete)
 * - Password strength validation and changes
 * - Audit logging for security tracking
 * 
 * Security features:
 * - bcrypt password hashing via PostgreSQL
 * - JWT token-based authentication
 * - Role-based access control (user/admin)
 * - Password strength enforcement
 * - Audit trail logging
 */

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/database'
import { logger } from '../utils/logger'
import { validatePasswordStrength } from '../utils/passwordValidator'
import { generateJWTToken, verifyJWTToken } from '../utils/authTokens'
import { auditUserAction, logUserAction } from '../utils/auditLogger'

// Create Express router for handling auth routes
const router = express.Router()

/**
 * User Interface Definition
 * Defines the structure of user data from database
 */
interface User {
  id: string           // UUID primary key
  email: string        // User's email address (unique)
  password_hash: string // bcrypt hashed password
  role: 'user' | 'admin' // Role-based access control
  first_name: string   // User's first name
  last_name: string    // User's last name
}


/**
 * POST /api/auth/login
 * 
 * User Authentication Endpoint
 * 
 * This endpoint handles user login with email and password.
 * It includes password strength validation and forces password
 * changes for weak or default passwords.
 * 
 * Request Body:
 * - email: string (required)
 * - password: string (required)
 * 
 * Response Cases:
 * 1. Success with strong password: JWT token + user data
 * 2. Success but weak password: JWT token + requirePasswordChange flag
 * 3. Invalid credentials: 401 error
 * 4. Missing data: 400 error
 */
router.post('/login', async (req, res) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body
    
    // Log the login attempt
    logger.request('POST', '/api/auth/login', undefined, { email })
    logger.debug('Login attempt initiated', { email, hasPassword: !!password })

    // Validation: ensure required fields are provided
    if (!email || !password) {
      logger.debug('Login validation failed: missing credentials', { hasEmail: !!email, hasPassword: !!password })
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Database Query: Find user by email
    // Uses parameterized query to prevent SQL injection
    const userQuery = `
      SELECT id, email, password_hash, role, first_name, last_name 
      FROM users 
      WHERE email = $1
    `
    logger.database('SELECT user by email', userQuery, [email])
    const userResult = await pool.query(userQuery, [email])

    // Check if user exists
    if (userResult.rows.length === 0) {
      logger.debug('Login failed: user not found', { email })
      // Return generic "invalid credentials" message for security
      // (don't reveal whether email exists or not)
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const user: User = userResult.rows[0]
    logger.debug('User found for login', { userId: user.id, email: user.email, role: user.role })

    // Password Verification using PostgreSQL's crypt function
    // This compares the provided password with the stored hash
    // PostgreSQL handles the bcrypt comparison securely
    const passwordQuery = `SELECT password_hash = crypt($1, password_hash) as is_valid FROM users WHERE id = $2`
    logger.database('Verify password', passwordQuery, [password, user.id])
    const passwordResult = await pool.query(passwordQuery, [password, user.id])

    // Check if password is correct
    if (!passwordResult.rows[0].is_valid) {
      logger.debug('Login failed: invalid password', { userId: user.id, email })
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Password Strength Check
    // Even if login is successful, check if password meets current requirements
    const passwordValidation = validatePasswordStrength(password, user.email)
    
    if (!passwordValidation.isValid) {
      logger.debug('Login successful but password change required', { 
        userId: user.id, 
        email, 
        role: user.role,
        passwordIssues: passwordValidation.reasons 
      })
      
      // Password is weak or is default admin reset password
      // Still provide JWT token so user can access password change endpoint
      const token = generateJWTToken({
        id: user.id,
        email: user.email,
        role: user.role
      })
      
      // Return success but indicate password change is required
      return res.status(200).json({
        success: true,
        requirePasswordChange: true,
        message: 'Password change required',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        token: token, // Token needed for password change API call
        passwordIssues: passwordValidation.reasons
      })
    }

    // Successful Login: Update last login timestamp
    logger.database('UPDATE last login timestamp', 
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', 
      [user.id])
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    // Generate JWT Token for successful login
    // Token contains user ID, email, and role for authorization
    const token = generateJWTToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    logger.debug('Login successful', { 
      userId: user.id, 
      email, 
      role: user.role,
      tokenExpiresIn: '24h'
    })

    // Return successful login response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        token
      }
    })
  } catch (error) {
    // Log error for debugging (don't expose to client)
    logger.error('Login authentication error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * POST /api/auth/verify
 * 
 * JWT Token Verification Endpoint
 * 
 * This endpoint verifies if a JWT token is valid and not expired.
 * Used by frontend to check authentication status.
 * 
 * Request Body:
 * - token: string (required) - JWT token to verify
 * 
 * Response:
 * - Success: User data from token
 * - Failure: Invalid/expired token error
 */
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body

    // Validation: ensure token is provided
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      })
    }

    // Verify JWT token using secret key
    // This will throw an error if token is invalid or expired
    const decoded = verifyJWTToken(token)

    // Return user data from decoded token
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      }
    })
  } catch (error) {
    // JWT verification failed (invalid or expired token)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
})

/**
 * Extended Express Request Interface
 * 
 * Adds user property to Express Request for authenticated routes.
 * This allows middleware to attach user data to the request object.
 */
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * JWT Token Verification Middleware
 * 
 * This middleware function runs before protected routes to verify
 * that the request includes a valid JWT token in the Authorization header.
 * 
 * Expected header format: "Authorization: Bearer <jwt_token>"
 * 
 * If valid, adds user data to req.user for use in route handlers.
 * If invalid, returns 401/403 error response.
 */
const verifyToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  // Extract Authorization header
  const authHeader = req.headers.authorization
  
  // Extract token from "Bearer <token>" format
  const token = authHeader && authHeader.split(' ')[1]

  // Check if token is provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    })
  }

  try {
    // Verify JWT token
    const decoded = verifyJWTToken(token)
    
    // Attach user data to request object for use in route handlers
    req.user = decoded
    
    // Continue to next middleware/route handler
    next()
  } catch (error) {
    // Token verification failed
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

/**
 * Admin Role Verification Middleware
 * 
 * This middleware checks if the authenticated user has admin role.
 * Must be used after verifyToken middleware.
 * 
 * Returns 403 error if user is not an admin.
 */
const requireAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  // Check if user exists and has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  
  // User is admin, continue to route handler
  next()
}

/**
 * POST /api/auth/create-user
 * 
 * Create New User Endpoint (Admin Only)
 * 
 * Allows admins to create new user accounts with specified roles.
 * Includes validation, duplicate checking, and audit logging.
 * 
 * Required Middleware: verifyToken, requireAdmin
 * 
 * Request Body:
 * - email: string (required, unique)
 * - password: string (required)
 * - role: string (optional, default: 'user', values: 'user'|'admin')
 * - first_name: string (required)
 * - last_name: string (required)
 */
router.post('/create-user', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    logger.request('POST', '/api/auth/create-user', req.user?.id)
    logger.debug('Create user request initiated', { 
      adminUserId: req.user?.id, 
      targetEmail: req.body.email, 
      targetRole: req.body.role 
    })
    
    // Extract user data from request body
    const { email, password, role = 'user', first_name, last_name } = req.body

    // Validation: check required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first_name, and last_name are required'
      })
    }

    // Validation: check role is valid
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin"'
      })
    }

    // Check if user already exists (prevent duplicate emails)
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1'
    const existingUser = await pool.query(existingUserQuery, [email])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      })
    }

    // Create new user with PostgreSQL's crypt function for password hashing
    // gen_salt('bf') generates a bcrypt salt
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, role, first_name, last_name)
      VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
      RETURNING id, email, role, first_name, last_name, created_at
    `
    
    const newUserResult = await pool.query(insertUserQuery, [
      email, password, role, first_name, last_name
    ])

    const newUser = newUserResult.rows[0]

    // Audit Logging: Record user creation for security tracking
    await auditUserAction(
      {
        action: 'INSERT',
        tableName: 'users',
        recordId: newUser.id,
        newData: newUser,
        changedBy: req.user?.id || null
      },
      `User created: ${newUser.email} by admin ${req.user?.email || 'unknown'}`,
      {
        action: 'USER_CREATE',
        targetUserId: newUser.id,
        targetUserEmail: newUser.email,
        adminUserId: req.user?.id,
        adminUserEmail: req.user?.email
      }
    )

    // Return success response with new user data
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser
      }
    })
  } catch (error) {
    logger.error('User creation error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * GET /api/auth/users
 * 
 * Get All Users Endpoint (Admin Only)
 * 
 * Returns a list of all users in the system with their profile information.
 * Excludes sensitive data like password hashes.
 * 
 * Required Middleware: verifyToken, requireAdmin
 * 
 * Response: Array of user objects ordered by creation date
 */
router.get('/users', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // Query all users with non-sensitive information
    // Password hashes are excluded for security
    const usersQuery = `
      SELECT id, email, role, first_name, last_name, created_at, last_login_at
      FROM users 
      ORDER BY created_at DESC
    `
    const usersResult = await pool.query(usersQuery)

    // Return user list
    res.json({
      success: true,
      data: {
        users: usersResult.rows
      }
    })
  } catch (error) {
    logger.error('Get users list error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * PATCH /api/auth/users/:userId/reset-password
 * 
 * Reset User Password Endpoint (Admin Only)
 * 
 * Resets a user's password to a temporary password (email prefix).
 * The temporary password will require change on next login due to
 * password strength validation.
 * 
 * Required Middleware: verifyToken, requireAdmin
 * 
 * URL Parameters:
 * - userId: string (UUID of user to reset)
 * 
 * Security Features:
 * - Admin cannot reset their own password
 * - Generates predictable temporary password for admin communication
 * - Audit logging of password resets
 */
router.patch('/users/:userId/reset-password', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params

    // Validation: ensure user ID is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
    }

    // Check if target user exists
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id = $1'
    const userResult = await pool.query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const user = userResult.rows[0]

    // Security check: prevent admins from resetting their own password
    // This prevents accidental lockouts
    if (req.user?.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset your own password'
      })
    }

    // Generate temporary password from email prefix
    // This creates a predictable password that admins can communicate to users
    // It will fail password strength validation, forcing a password change
    console.log('🔍 DEBUG: User object:', JSON.stringify(user, null, 2))
    console.log('🔍 DEBUG: User email:', user.email)
    
    if (!user.email) {
      throw new Error('User email is missing - cannot generate temporary password')
    }
    
    const newPassword = user.email.split('@')[0]
    console.log('🔍 DEBUG: Generated temporary password:', newPassword)

    // Update password with new bcrypt hash
    const updatePasswordQuery = `
      UPDATE users 
      SET password_hash = crypt($1, gen_salt('bf')), updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING id, email, role, first_name, last_name
    `
    
    const updateResult = await pool.query(updatePasswordQuery, [newPassword, userId])
    const updatedUser = updateResult.rows[0]

    // Audit Logging: Record password reset for security tracking
    await auditUserAction(
      {
        action: 'PASSWORD_RESET',
        tableName: 'users',
        recordId: userId,
        newData: { ...updatedUser, new_password: newPassword },
        changedBy: req.user?.id || null
      },
      `Password reset: ${user.email} by admin ${req.user?.email || 'unknown'}`,
      {
        action: 'PASSWORD_RESET',
        targetUserId: userId,
        targetUserEmail: user.email,
        adminUserId: req.user?.id,
        adminUserEmail: req.user?.email
      }
    )

    // Return success with temporary password
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: updatedUser,
        new_password: newPassword // Admin needs this to communicate to user
      }
    })
  } catch (error) {
    logger.error('Password reset error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * DELETE /api/auth/users/:userId
 * 
 * Delete User Endpoint (Admin Only)
 * 
 * Permanently removes a user account from the system.
 * Includes audit logging and prevents self-deletion.
 * 
 * Required Middleware: verifyToken, requireAdmin
 * 
 * URL Parameters:
 * - userId: string (UUID of user to delete)
 * 
 * Security Features:
 * - Admin cannot delete their own account
 * - Complete audit trail of deletion
 * - Hard delete from database (not soft delete)
 */
router.delete('/users/:userId', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params

    // Validation: ensure user ID is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
    }

    // Check if user exists and get user data for audit log
    const userQuery = 'SELECT * FROM users WHERE id = $1'
    const userResult = await pool.query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const userToDelete = userResult.rows[0]

    // Security check: prevent admins from deleting their own account
    // This prevents accidental lockouts
    if (req.user?.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      })
    }

    // Check for and delete associated form submissions first
    // Query all form submission tables that might contain data for this user
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'form_submissions_%'
    `
    const tablesResult = await pool.query(tablesQuery)
    
    // Delete submissions from each form table
    for (const table of tablesResult.rows) {
      const tableName = table.table_name
      try {
        const deleteSubmissionsQuery = `DELETE FROM ${tableName} WHERE submitted_by = $1`
        const deletedResult = await pool.query(deleteSubmissionsQuery, [userId])
        if (deletedResult.rowCount && deletedResult.rowCount > 0) {
          logger.debug('Deleted form submissions for user', { 
            userId, 
            tableName, 
            deletedCount: deletedResult.rowCount 
          })
        }
      } catch (error) {
        logger.warn('Failed to delete submissions from form table', { 
          userId, 
          tableName, 
          error: (error as Error).message 
        })
        // Continue with other tables even if one fails
      }
    }

    // Hard delete user from database
    // Note: This is a permanent action - consider soft delete for production
    const deleteQuery = `DELETE FROM users WHERE id = $1`
    await pool.query(deleteQuery, [userId])

    // Audit Logging: Record user deletion for security tracking
    // Store the complete user record before deletion
    await auditUserAction(
      {
        action: 'DELETE',
        tableName: 'users',
        recordId: userId,
        oldData: userToDelete,
        changedBy: req.user?.id || null
      },
      `User deleted: ${userToDelete.email} by admin ${req.user?.email || 'unknown'}`,
      {
        action: 'USER_DELETE',
        targetUserId: userId,
        targetUserEmail: userToDelete.email,
        adminUserId: req.user?.id,
        adminUserEmail: req.user?.email
      }
    )

    // Return success response with deleted user info
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        user: {
          id: userToDelete.id,
          email: userToDelete.email,
          role: userToDelete.role,
          first_name: userToDelete.first_name,
          last_name: userToDelete.last_name
        }
      }
    })
  } catch (error) {
    logger.error('User deletion error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * POST /api/auth/change-password
 * 
 * Change Password Endpoint (Authenticated Users)
 * 
 * Allows authenticated users to change their password.
 * Includes current password verification and new password strength validation.
 * 
 * Required Middleware: verifyToken (any authenticated user)
 * 
 * Request Body:
 * - currentPassword: string (required) - User's current password for verification
 * - newPassword: string (required) - New password that must meet strength requirements
 * 
 * Security Features:
 * - Current password verification
 * - New password strength validation
 * - Audit logging of password changes
 * - Debug logging for troubleshooting (remove in production)
 */
router.post('/change-password', verifyToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // Extract and validate request data
    const { currentPassword, newPassword } = req.body
    const userId = req.user?.id

    // Validation: ensure both passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }

    // Validation: ensure user is authenticated (should always be true due to middleware)
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    // Get user data from database
    const userQuery = 'SELECT id, email, password_hash FROM users WHERE id = $1'
    const userResult = await pool.query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const user = userResult.rows[0]

    // Verify current password using PostgreSQL's crypt function
    // This ensures the user knows their current password before changing
    const passwordQuery = `SELECT password_hash = crypt($1, password_hash) as is_valid FROM users WHERE id = $2`
    const passwordResult = await pool.query(passwordQuery, [currentPassword, userId])

    if (!passwordResult.rows[0].is_valid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Validate new password strength
    // This ensures the new password meets security requirements
    const passwordValidation = validatePasswordStrength(newPassword, user.email)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        passwordIssues: passwordValidation.reasons
      })
    }

    // Update password with new bcrypt hash
    const updatePasswordQuery = `
      UPDATE users 
      SET password_hash = crypt($1, gen_salt('bf')), updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING id, email, role, first_name, last_name
    `
    
    const updateResult = await pool.query(updatePasswordQuery, [newPassword, userId])
    const updatedUser = updateResult.rows[0]

    // Audit Logging: Record password change for security tracking
    await auditUserAction(
      {
        action: 'PASSWORD_CHANGE',
        tableName: 'users',
        recordId: userId,
        newData: { ...updatedUser, password_changed_by_user: true },
        changedBy: userId
      },
      `Password changed: ${user.email} by user themselves`,
      {
        action: 'PASSWORD_CHANGE',
        userId: userId,
        userEmail: user.email,
        selfService: true
      }
    )

    // Return success response
    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        user: updatedUser
      }
    })
  } catch (error) {
    logger.error('Password change error', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Export router and middleware for use in other modules
export default router
export { verifyToken, requireAdmin }