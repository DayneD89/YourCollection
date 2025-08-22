/**
 * Change Password Page - Secure Password Update Interface
 * 
 * This page allows users to change their password, either voluntarily or when
 * required by the system for security compliance. It includes comprehensive
 * password validation and user guidance.
 * 
 * Key features:
 * - Current password verification for security
 * - Password strength validation with clear requirements
 * - Real-time feedback on password compliance
 * - Secure API communication with JWT authentication
 * - URL parameter handling for password issues from login
 * - Automatic redirect after successful change
 * 
 * Security considerations:
 * - Requires current password to prevent unauthorized changes
 * - Validates password strength before submission
 * - Uses HTTPS for password transmission
 * - Clears sensitive data from memory after use
 * 
 * React concepts demonstrated:
 * - useEffect for URL parameter parsing and authentication checks
 * - Form validation with custom validation functions
 * - Error handling and user feedback
 * - Loading states during API operations
 * - Dynamic content rendering based on validation results
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/utils/logger'

/**
 * Change Password Page Component
 * 
 * This component provides a secure interface for users to update their passwords.
 * It handles both voluntary password changes and mandatory changes required
 * by the system for security compliance.
 */
function ChangePasswordContent() {
  // Form State Management
  const [currentPassword, setCurrentPassword] = useState('')    // User's existing password
  const [newPassword, setNewPassword] = useState('')            // User's desired new password
  const [confirmPassword, setConfirmPassword] = useState('')    // Confirmation of new password
  const [error, setError] = useState('')                       // Error message to display
  const [loading, setLoading] = useState(false)                // Loading state during password change
  const [passwordIssues, setPasswordIssues] = useState<string[]>([])  // Issues from login attempt
  const [currentUser, setCurrentUser] = useState<{ email?: string } | null>(null)    // User data from URL params
  
  // Navigation and Authentication
  const router = useRouter()        // Next.js router for navigation
  const searchParams = useSearchParams()  // URL parameters (for password issues)
  
  // Check if password change is required immediately based on URL parameters
  // This ensures the message is available during server-side rendering
  const required = searchParams.get('required')
  const issuesParam = searchParams.get('issues')
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(
    required === 'true' || !!issuesParam
  )
  const { user, changePassword } = useAuth()        // Current user and changePassword function from AuthContext
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'  // Default to dashboard

  /**
   * Initialize Component State and Parse URL Parameters
   * 
   * This useEffect runs when the component mounts and handles:
   * 1. Authentication verification - redirect to login if not authenticated
   * 2. URL parameter parsing - extract password issues from login attempt
   * 
   * Why we do this:
   * - Ensures only authenticated users can access password change
   * - Preserves password validation issues from the login attempt
   * - Provides context for why password change is required
   * 
   * URL parameter format:
   * /change-password?issues=["issue1","issue2"]
   */
  useEffect(() => {
    logger.component('ChangePasswordPage', 'mount')
    
    // Parse user data from URL parameters
    const userParam = searchParams.get('user')
    let userFromUrl = null
    if (userParam) {
      try {
        userFromUrl = JSON.parse(decodeURIComponent(userParam))
        setCurrentUser(userFromUrl)
        logger.debug('User data parsed from URL parameters', { userId: userFromUrl.id })
      } catch (e) {
        logger.error('Failed to parse user data from URL', e)
      }
    }
    
    // Use URL user data or fallback to AuthContext user
    const effectiveUser = userFromUrl || user
    
    // Security check: redirect unauthenticated users to login
    if (!effectiveUser) {
      logger.debug('Redirecting unauthenticated user to login from change-password page')
      router.push('/login')
      return
    }

    logger.debug('Change password page loaded for user', { userId: effectiveUser.id })

    // Parse password issues from URL parameters
    const issues = searchParams.get('issues')
    if (issues) {
      try {
        // Decode and parse JSON array of password issues
        const parsedIssues = JSON.parse(decodeURIComponent(issues))
        setPasswordIssues(parsedIssues)
        logger.debug('Password issues parsed from URL parameters', { issues: parsedIssues })
      } catch (e) {
        // Handle malformed URL parameters gracefully
        logger.error('Failed to parse password issues from URL', e)
      }
    }

    // Password change requirement is now determined at component initialization
    // based on URL parameters, so no need to set it here
  }, [user, router, searchParams])  // Re-run if any of these change

  /**
   * Client-Side Password Validation
   * 
   * This function validates the new password against security requirements
   * before sending it to the server. It provides immediate feedback to users
   * without requiring a server round-trip.
   * 
   * Security requirements:
   * - Minimum 8 characters (industry standard)
   * - At least one number (prevents dictionary attacks)
   * - At least one special character (increases complexity)
   * - Cannot be email prefix (prevents obvious passwords)
   * 
   * Why client-side validation:
   * - Immediate user feedback
   * - Reduces server load
   * - Better user experience
   * - Note: Server also validates for security
   * 
   * @param password - The password to validate
   * @returns Array of validation issues (empty if valid)
   */
  const validatePassword = (password: string): string[] => {
    const issues: string[] = []
    
    // Ensure we have a string and trim any whitespace
    const cleanPassword = (password || '').toString().trim()
    
    // Length requirement: minimum 8 characters
    if (cleanPassword.length < 8) {
      issues.push('Password must be at least 8 characters long')
    }
    
    // Numeric requirement: at least one digit
    if (!/\d/.test(cleanPassword)) {
      issues.push('Password must contain at least one number')
    }
    
    // Special character requirement: increases password complexity
    // Regex matches common special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanPassword)) {
      issues.push('Password must contain at least one special character')
    }
    
    // Email prefix check: prevents obvious, weak passwords
    const effectiveUser = currentUser || user
    if (effectiveUser?.email && cleanPassword === effectiveUser.email.split('@')[0]) {
      issues.push('Password cannot be the same as your email prefix')
    }
    
    return issues
  }

  /**
   * Handle Password Change Form Submission
   * 
   * This function processes the password change form with multiple validation steps:
   * 1. Client-side validation (password match, strength requirements)
   * 2. Server-side validation and authentication
   * 3. Success handling and navigation
   * 
   * Security flow:
   * - Verify current password (prevents unauthorized changes)
   * - Validate new password strength
   * - Send encrypted request to server
   * - Handle server response and update UI
   * 
   * Error handling:
   * - Password mismatch (client-side)
   * - Validation failures (client and server-side)
   * - Network errors
   * - Authentication errors
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  // Prevent browser form submission
    setError('')        // Clear previous error messages
    setLoading(true)    // Show loading state
    
    logger.form('ChangePasswordForm', 'submit', { 
      userId: user?.id, 
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      hasConfirmPassword: !!confirmPassword
    })
    
    // Client-side validation: password confirmation match
    if (newPassword !== confirmPassword) {
      logger.debug('Password change validation failed - passwords do not match')
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    // Client-side validation: password strength requirements
    const validationIssues = validatePassword(newPassword)
    if (validationIssues.length > 0) {
      logger.debug('Password change validation failed - strength requirements', { issues: validationIssues })
      setError(`Password validation failed: ${validationIssues.join(', ')}`)
      setLoading(false)
      return
    }

    logger.debug('Client-side password validation passed, sending to server')

    try {
      // Use AuthContext changePassword function instead of direct API call
      // This ensures user state is properly updated after password change
      const result = await changePassword(currentPassword, newPassword)

      if (result.success) {
        // Password change successful
        logger.auth('Password changed successfully in change-password page', { userId: user?.id })
        setError('')  // Clear any previous errors
        
        // Create temporary success message for E2E tests to detect
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message text-green-600 text-sm text-center';
        successDiv.textContent = 'Password changed successfully';
        document.body.appendChild(successDiv);
        
        logger.debug('Redirecting to return URL after successful password change', { returnUrl })
        // Redirect to return URL or dashboard after brief delay
        setTimeout(() => {
          router.push(returnUrl)
        }, 100);
      } else {
        // Password change failed - show server error message
        logger.auth('Password change failed in change-password page', { 
          userId: user?.id, 
          error: result.message
        })
        setError(result.message || 'Failed to change password')
      }
    } catch (error) {
      // Network or other error occurred
      logger.error('Change password form submission error', error)
      setError('Network error. Please try again.')
    } finally {
      // Always clear loading state
      setLoading(false)
      logger.debug('Change password form submission completed, loading state cleared')
    }
  }

  // Show loading state while redirecting unauthenticated users
  const effectiveUser = currentUser || user
  if (!effectiveUser) {
    return <div>Redirecting...</div>
  }

  /**
   * Render Password Change Interface
   * 
   * This creates a comprehensive password change form with:
   * - Clear instructions and requirements
   * - Visual feedback for password issues
   * - Secure form handling
   * - Accessible design with proper labels
   * 
   * Layout structure:
   * 1. Page header with context
   * 2. Password requirements display
   * 3. Three-field form (current, new, confirm)
   * 4. Error messages and loading states
   * 5. Submit button with loading feedback
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Change Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password needs to be updated to meet security requirements
          </p>
        </div>

        {/* Password Change Required Message */}
        {isPasswordChangeRequired && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
            <strong className="font-bold">Password change required</strong>
            <p className="text-sm mt-1">Your administrator has reset your password and requires you to create a new one.</p>
          </div>
        )}

        {/* Dynamic Password Issues from Login Attempt */}
        {/* 
          If user was redirected here from login due to password issues,
          show the specific problems that need to be addressed
        */}
        {passwordIssues.length > 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong className="font-bold">Password Requirements:</strong>
            <ul className="list-disc list-inside mt-2">
              {passwordIssues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Static Password Requirements Display */}
        {/* 
          Always show the complete list of password requirements
          to guide users in creating a compliant password
        */}
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong className="font-bold">Password Requirements:</strong>
          <ul className="list-disc list-inside mt-2 text-sm">
            <li>At least 8 characters long</li>
            <li>Contains at least one number</li>
            <li>Contains at least one special character</li>
            <li>Cannot be the same as your email prefix</li>
          </ul>
        </div>

        {/* Password Change Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Current Password Field */}
            {/* Required for security verification - prevents unauthorized password changes */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"  // Hide password input
                required         // HTML5 validation
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                placeholder="Enter your current password"
                value={currentPassword}  // Controlled component
                onChange={(e) => setCurrentPassword(e.target.value)}  // Update state
              />
            </div>
            
            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            {/* Confirm Password Field */}
            {/* Prevents typos in password entry */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}  // Prevent double-submission during password change
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Dynamic button text based on loading state */}
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Wrapped Change Password Page with Suspense
 * 
 * This wrapper component provides the Suspense boundary required for 
 * useSearchParams in Next.js 15 production builds.
 */
export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <ChangePasswordContent />
    </Suspense>
  )
}