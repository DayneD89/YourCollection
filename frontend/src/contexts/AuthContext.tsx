/**
 * Authentication Context for Party Collection Application
 * 
 * This file implements React Context-based authentication state management.
 * It provides a centralized way to handle user authentication, authorization,
 * and user management operations throughout the application.
 * 
 * Key concepts for new developers:
 * - React Context: Allows sharing state across components without prop drilling
 * - JWT Tokens: JSON Web Tokens for secure authentication
 * - localStorage: Browser storage for persisting authentication state
 * - Async/Await: Modern JavaScript for handling API calls
 * - TypeScript Interfaces: Type definitions for data structures
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from '@/utils/logger'

/**
 * User Data Structure
 * 
 * Represents a user in the system with their basic information.
 * This interface defines what data we expect for each user.
 */
export interface User {
  id: string         // Unique identifier from database
  email: string      // User's email address (also used for login)
  role: 'user' | 'admin'  // Access level: 'user' for regular users, 'admin' for administrators
  first_name: string // User's first name
  last_name: string  // User's last name
}

/**
 * Authentication Context Interface
 * 
 * Defines all the authentication-related functions and state
 * that will be available to components throughout the app.
 * This is like a "contract" that describes what the AuthContext provides.
 */
interface AuthContextType {
  // Current authentication state
  user: User | null              // Currently logged-in user (null if not authenticated)
  isAuthenticated: boolean       // Quick check if user is logged in
  requiresPasswordChange: boolean // True if user must change password before accessing other pages
  token: string | null           // JWT token for API authentication
  isLoading: boolean             // Loading state during authentication operations
  
  // Authentication functions
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    requirePasswordChange?: boolean;  // True if user must change password
    passwordIssues?: string[];        // Array of password requirement violations
    error?: string;                   // Error message for failed login
  }>
  logout: () => void             // Clear authentication state
  
  // Password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ 
    success: boolean; 
    message?: string 
  }>
  
  // User management functions (admin only)
  createUser: (userData: CreateUserData) => Promise<{ 
    success: boolean; 
    message?: string; 
    user?: User 
  }>
  getUsers: () => Promise<User[]>  // Fetch all users (admin only)
  deleteUser: (userId: string) => Promise<{ 
    success: boolean; 
    message?: string 
  }>
  resetPassword: (userId: string) => Promise<{ 
    success: boolean; 
    message?: string; 
    data?: {
      user?: User;
      new_password?: string;        // The new temporary password
    }
  }>
}

/**
 * Data structure for creating new users
 * 
 * Used when admin creates a new user account.
 * Contains all required information for user creation.
 */
interface CreateUserData {
  email: string
  password: string
  role: 'user' | 'admin'
  first_name: string
  last_name: string
}

/**
 * Create the Authentication Context
 * 
 * React.createContext() creates a Context object. When React renders a component
 * that subscribes to this Context, it will read the current context value from the
 * closest matching Provider above it in the component tree.
 * 
 * The undefined type allows us to detect when useAuth() is called outside of AuthProvider.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * API Base URL Configuration
 * 
 * Uses environment variable for flexibility across different environments:
 * - Development: http://localhost:3001 (local backend)
 * - Production: Would be set via NEXT_PUBLIC_API_URL environment variable
 * 
 * NEXT_PUBLIC_ prefix makes this variable available in the browser.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Authentication Provider Component
 * 
 * This is the main component that provides authentication state and functions
 * to all child components. It wraps the entire application to make auth
 * available everywhere.
 * 
 * How it works:
 * 1. Maintains authentication state (user, token) using React useState
 * 2. Provides functions for login, logout, user management
 * 3. Persists authentication state in browser localStorage
 * 4. Makes everything available via React Context
 * 
 * @param children - All the React components that will have access to auth
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // State Management
  // useState hooks create reactive state that triggers re-renders when changed
  const [user, setUser] = useState<User | null>(null)    // Current user data
  const [token, setToken] = useState<string | null>(null) // JWT authentication token
  const [isLoading, setIsLoading] = useState(true)        // Loading state for auth operations
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false) // Password change required

  /**
   * Verify Token with Server
   * 
   * Validates a stored token with the backend to ensure it's still valid.
   * If valid, sets user data. If invalid, clears stored token.
   * 
   * @param token - JWT token to verify
   * @returns Promise<boolean> - true if token is valid, false otherwise
   */
  const verifyTokenWithServer = async (token: string): Promise<boolean> => {
    try {
      logger.auth('Verifying stored token with server')
      logger.api('POST', `${API_BASE_URL}/api/auth/verify`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      logger.api('POST', `${API_BASE_URL}/api/auth/verify`, response.status, { success: data.success })

      if (data.success && data.data?.user) {
        logger.auth('Token verification successful', { 
          userId: data.data.user.id, 
          email: data.data.user.email, 
          role: data.data.user.role 
        })
        
        // Token is valid - set user data
        setUser(data.data.user)
        setToken(token)
        return true
      } else {
        logger.auth('Token verification failed - invalid token')
        // Token is invalid - clear stored token
        localStorage.removeItem('auth_token')
        setUser(null)
        setToken(null)
        return false
      }
    } catch (error) {
      logger.error('Token verification network error', error)
      // Network error - clear stored token to be safe
      localStorage.removeItem('auth_token')
      setUser(null)
      setToken(null)
      return false
    }
  }

  /**
   * Initialize Authentication State on App Load
   * 
   * useEffect runs when the component mounts (empty dependency array [])
   * This checks if the user was previously logged in by looking for a stored token
   * and validates it with the server to ensure it's still valid.
   * 
   * Why we do this:
   * - Users shouldn't have to login every time they refresh the page
   * - localStorage persists data between browser sessions
   * - We restore the authentication state from the previous session
   * - We verify the token is still valid (not expired or revoked)
   */
  useEffect(() => {
    const initializeAuth = async () => {
      logger.component('AuthProvider', 'mount')
      logger.debug('Initializing authentication state from localStorage')
      
      try {
        // Check for stored token on app load
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          logger.debug('Found stored authentication token', { hasToken: true })
          
          // Verify token with server to ensure it's still valid (with timeout)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Token verification timeout')), 10000)
          )
          
          try {
            await Promise.race([verifyTokenWithServer(storedToken), timeoutPromise])
          } catch (error) {
            logger.error('Token verification failed or timed out', error)
            localStorage.removeItem('auth_token')
            setUser(null)
            setToken(null)
          }
        } else {
          logger.debug('No stored authentication token found')
        }
      } catch (error) {
        logger.error('Authentication initialization error', error)
      }
      
      // Initial loading complete
      setIsLoading(false)
    }

    initializeAuth()
  }, []) // Empty dependency array means this only runs once on mount

  /**
   * User Login Function
   * 
   * Handles user authentication by sending credentials to the backend API.
   * This is an async function that communicates with the server.
   * 
   * How the login process works:
   * 1. Send email/password to backend API
   * 2. Backend validates credentials against database
   * 3. If valid, backend returns user data and JWT token
   * 4. We store the token and user data for future API calls
   * 5. Return success status and any special requirements
   * 
   * Special cases:
   * - If password change is required, user is authenticated but redirected to change password
   * - Password issues are returned to guide user in creating a compliant password
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with login result and any special requirements
   */
  const login = async (email: string, password: string): Promise<{ 
    success: boolean; 
    requirePasswordChange?: boolean; 
    passwordIssues?: string[];
    error?: string;
  }> => {
    try {
      setIsLoading(true)
      console.log('🔍 AUTH DEBUG: Login function called with:', email)
      logger.auth('Login attempt initiated', { email })
      logger.api('POST', `${API_BASE_URL}/api/auth/login`)
      
      // Make HTTP POST request to login endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Tell server we're sending JSON
        },
        body: JSON.stringify({ email, password }), // Convert JS object to JSON string
      })

      // Parse the JSON response from the server
      const data = await response.json()
      logger.api('POST', `${API_BASE_URL}/api/auth/login`, response.status, { success: data.success })
      console.log('🔍 AUTH DEBUG: Raw API response:', JSON.stringify(data, null, 2))
      console.log('🔍 AUTH DEBUG: Login attempt - email:', email)
      console.log('🔍 AUTH DEBUG: Response status:', response.status)
      console.log('🔍 AUTH DEBUG: Response data success:', data.success)
      console.log('🔍 AUTH DEBUG: Response data requirePasswordChange:', data.requirePasswordChange)

      if (data.success) {
        if (data.requirePasswordChange) {
          logger.auth('Login successful - password change required', { 
            userId: data.user?.id, 
            passwordIssues: data.passwordIssues 
          })
          
          // Set user and token state for password change flow
          // User is authenticated but needs to change password
          if (data.token) {
            setToken(data.token)
            localStorage.setItem('auth_token', data.token) // Persist token
          }
          
          if (data.user) {
            setUser(data.user) // Set user so change-password page can access user data
          }
          
          // Set flag to prevent navigation away from change-password page
          setRequiresPasswordChange(true)
          
          const returnValue = {
            success: true,
            requirePasswordChange: true,
            passwordIssues: data.passwordIssues, // Guide user on password requirements
            user: data.user // Include user data for the change-password page to use
          };
          console.log('🔍 [AUTH_CONTEXT] Returning requirePasswordChange result:', JSON.stringify(returnValue, null, 2));
          return returnValue;
        } else {
          // Normal successful login - handle both response formats
          // Backend might return data in different structures, so we check both
          const user = data.user || data.data?.user;
          const token = data.token || data.data?.token;
          
          logger.auth('Login successful - normal flow', {
            userId: user?.id,
            email: user?.email,
            role: user?.role
          })
          logger.debug('Setting user and token state', { hasUser: !!user, hasToken: !!token })
          
          // Update application state
          setUser(user)   // Set current user
          setToken(token) // Set authentication token
          setRequiresPasswordChange(false) // Clear any previous password change requirement
          localStorage.setItem('auth_token', token) // Persist for future sessions
          logger.debug('Authentication state updated and persisted to localStorage')
          
          return { success: true }
        }
      }

      // Login failed - invalid credentials or other error
      logger.auth('Login failed', { email, reason: 'Invalid credentials or server error' })
      console.log('🔍 AUTH DEBUG: Returning login failure with error message')
      const failureResult = { success: false, error: 'Invalid email or password' }
      console.log('🔍 AUTH DEBUG: failureResult:', failureResult)
      return failureResult
    } catch (error) {
      // Network error or other exception occurred
      console.log('🔍 AUTH DEBUG: Login function caught exception:', error)
      logger.error('Login network error occurred', error)
      const catchResult = { success: false, error: 'Login failed. Please try again.' }
      console.log('🔍 AUTH DEBUG: catchResult:', catchResult)
      return catchResult
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * User Logout Function
   * 
   * Clears all authentication state and removes stored tokens.
   * This effectively "logs out" the user from the application.
   * 
   * What it does:
   * 1. Clear user data from component state
   * 2. Clear authentication token from component state  
   * 3. Remove stored token from browser localStorage
   * 
   * After logout, user will need to login again to access protected features.
   */
  const logout = () => {
    logger.auth('User logout initiated', { userId: user?.id, email: user?.email })
    setUser(null)  // Clear current user
    setToken(null) // Clear authentication token
    setRequiresPasswordChange(false) // Clear password change requirement
    localStorage.removeItem('auth_token') // Remove persisted token
    logger.debug('Authentication state cleared and localStorage token removed')
  }

  /**
   * Create New User (Admin Only)
   * 
   * Allows administrators to create new user accounts.
   * This function requires admin authentication.
   * 
   * How it works:
   * 1. Sends user data to backend API
   * 2. Backend validates admin permissions via JWT token
   * 3. Backend creates new user in database
   * 4. Returns success/failure result
   * 
   * Security:
   * - Requires valid JWT token in Authorization header
   * - Backend verifies admin role before allowing user creation
   * 
   * @param userData - New user's information (email, password, role, names)
   * @returns Promise with creation result
   */
  const createUser = async (userData: CreateUserData) => {
    try {
      logger.auth('Admin create user initiated', { email: userData.email, role: userData.role })
      logger.api('POST', `${API_BASE_URL}/api/auth/create-user`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include JWT token for authentication
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      logger.api('POST', `${API_BASE_URL}/api/auth/create-user`, response.status, { 
        success: data.success, 
        message: data.message 
      })
      
      // Handle both success and error cases properly
      if (data.success) {
        logger.auth('User created successfully', { newUserId: data.data?.user?.id, email: userData.email })
        return { 
          success: true, 
          message: data.message || 'User created successfully',
          user: data.data?.user
        }
      } else {
        // Server returned an error (could be 400, 409, etc.)
        logger.auth('User creation failed', { 
          email: userData.email, 
          status: response.status,
          message: data.message 
        })
        return { 
          success: false, 
          message: data.message || 'Failed to create user'
        }
      }
      
      // This line is unreachable but kept for safety
      return data
    } catch (error) {
      logger.error('Create user network error', error)
      return { success: false, message: 'Network error occurred' }
    }
  }

  /**
   * Get All Users (Admin Only)
   * 
   * Retrieves a list of all users in the system.
   * Only available to administrators.
   * 
   * How it works:
   * 1. Makes GET request to users endpoint
   * 2. Backend verifies admin permissions
   * 3. Backend returns array of all users
   * 4. We return the user array to the calling component
   * 
   * Used by admin dashboard to display user management table.
   * 
   * @returns Promise<User[]> - Array of all users, empty array if error
   */
  const getUsers = async (): Promise<User[]> => {
    try {
      logger.debug('Admin get users request initiated')
      logger.api('GET', `${API_BASE_URL}/api/auth/users`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Admin authentication required
        },
      })

      const data = await response.json()
      logger.api('GET', `${API_BASE_URL}/api/auth/users`, response.status, { 
        success: data.success, 
        userCount: data.success ? data.data.users.length : 0 
      })
      
      // Return users array if successful, empty array if failed
      return data.success ? data.data.users : []
    } catch (error) {
      logger.error('Get users network error', error)
      return [] // Return empty array on error
    }
  }

  /**
   * Delete User (Admin Only)
   * 
   * Permanently removes a user from the system.
   * This is a destructive operation that cannot be undone.
   * 
   * Security measures:
   * - Requires admin authentication
   * - Cannot delete yourself (prevented in UI)
   * - Confirmation dialog shown before deletion
   * 
   * How it works:
   * 1. Sends DELETE request to specific user endpoint
   * 2. Backend verifies admin permissions
   * 3. Backend removes user from database
   * 4. Returns success/failure result
   * 
   * @param userId - Unique ID of user to delete
   * @returns Promise with deletion result
   */
  const deleteUser = async (userId: string) => {
    try {
      logger.auth('Admin delete user initiated', { targetUserId: userId })
      logger.api('DELETE', `${API_BASE_URL}/api/auth/users/${userId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // Admin authentication required
        },
      })

      const data = await response.json()
      logger.api('DELETE', `${API_BASE_URL}/api/auth/users/${userId}`, response.status, { success: data.success })
      
      if (data.success) {
        logger.auth('User deleted successfully', { deletedUserId: userId })
      } else {
        logger.auth('User deletion failed', { targetUserId: userId, message: data.message })
      }
      
      return data
    } catch (error) {
      logger.error('Delete user network error', error)
      return { success: false, message: 'Network error occurred' }
    }
  }

  /**
   * Reset User Password (Admin Only)
   * 
   * Generates a new temporary password for a user.
   * The new password is based on the user's email prefix.
   * 
   * How it works:
   * 1. Admin selects a user to reset password for
   * 2. Backend generates new password (email prefix)
   * 3. Backend updates user's password in database
   * 4. Returns the new temporary password to admin
   * 5. Admin can share new password with user
   * 
   * Security:
   * - Requires admin authentication
   * - User will be prompted to change password on next login
   * - Temporary password follows a predictable but secure pattern
   * 
   * @param userId - Unique ID of user whose password to reset
   * @returns Promise with reset result and new password
   */
  const resetPassword = async (userId: string) => {
    try {
      logger.auth('Admin reset password initiated', { targetUserId: userId })
      logger.api('PATCH', `${API_BASE_URL}/api/auth/users/${userId}/reset-password`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`, // Admin authentication required
        },
      })

      const data = await response.json()
      logger.api('PATCH', `${API_BASE_URL}/api/auth/users/${userId}/reset-password`, response.status, { success: data.success })
      
      if (data.success) {
        logger.auth('Password reset successfully', { targetUserId: userId, hasNewPassword: !!data.new_password })
      } else {
        logger.auth('Password reset failed', { targetUserId: userId, message: data.message })
      }
      
      return data
    } catch (error) {
      logger.error('Reset password network error', error)
      return { success: false, message: 'Network error occurred' }
    }
  }

  /**
   * Change Password (Authenticated Users)
   * 
   * Allows users to change their own password.
   * Requires current password for security verification.
   * 
   * How it works:
   * 1. User provides current password and new password
   * 2. Backend verifies current password is correct
   * 3. Backend validates new password meets requirements
   * 4. Backend updates password in database
   * 5. User data is updated to reflect password change
   * 
   * Security:
   * - Must provide correct current password
   * - New password must meet strength requirements
   * - User remains logged in after successful change
   * - JWT token remains valid (no re-login required)
   * 
   * @param currentPassword - User's existing password
   * @param newPassword - User's desired new password
   * @returns Promise with change result
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      logger.auth('Password change initiated', { userId: user?.id })
      logger.api('POST', `${API_BASE_URL}/api/auth/change-password`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // User authentication required
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()
      logger.api('POST', `${API_BASE_URL}/api/auth/change-password`, response.status, { success: data.success })
      
      if (data.success) {
        logger.auth('Password changed successfully', { userId: user?.id })
        logger.debug('Updating user data after password change')
        
        // Update user data after successful password change
        setUser(data.data.user)
        // Clear the password change requirement flag
        setRequiresPasswordChange(false)
        // Password change was successful, no need to re-login
        // The existing token is still valid for the current session
        return { success: true, message: data.message }
      } else {
        logger.auth('Password change failed', { userId: user?.id, message: data.message })
      }
      
      return data
    } catch (error) {
      logger.error('Change password network error', error)
      return { success: false, message: 'Network error occurred' }
    }
  }

  /**
   * Authentication Status
   * 
   * Simple boolean check: if we have a user object, they're authenticated.
   * This is used throughout the app to show/hide features and redirect users.
   */
  const isAuthenticated = user !== null

  /**
   * Provide Authentication Context to Child Components
   * 
   * AuthContext.Provider makes all the authentication state and functions
   * available to any component in the component tree below it.
   * 
   * The value prop contains everything that child components can access
   * when they use the useAuth() hook.
   */
  return (
    <AuthContext.Provider value={{ 
      // Authentication state
      user,              // Current user data
      isAuthenticated,   // Boolean: is user logged in?
      requiresPasswordChange, // Boolean: must user change password?
      token,             // JWT token for API calls
      isLoading,         // Loading state for auth operations
      
      // Authentication functions
      login,             // Log user in
      logout,            // Log user out
      changePassword,    // Change own password
      
      // Admin user management functions
      createUser,        // Create new user (admin only)
      getUsers,          // Get all users (admin only)
      deleteUser,        // Delete user (admin only)
      resetPassword,     // Reset user password (admin only)
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook - Access Authentication Context
 * 
 * This is a custom React hook that provides access to the authentication
 * context from any component. It's a convenience wrapper around useContext.
 * 
 * How to use in components:
 * ```
 * import { useAuth } from '@/contexts/AuthContext'
 * 
 * function MyComponent() {
 *   const { user, login, logout, isAuthenticated } = useAuth()
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>
 *   }
 *   
 *   return <div>Welcome, {user.first_name}!</div>
 * }
 * ```
 * 
 * Error handling:
 * - Throws error if used outside of AuthProvider
 * - This prevents bugs where components try to access auth without proper setup
 * 
 * @returns AuthContextType - All authentication state and functions
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  // Safety check: ensure hook is used within AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. '
      + 'Make sure your component is wrapped in <AuthProvider>.')
  }
  
  return context
}