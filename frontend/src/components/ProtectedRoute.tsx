/**
 * ProtectedRoute Component - Route-Level Authentication Guard
 * 
 * This component provides authentication and authorization protection for pages.
 * It acts as a "wrapper" that checks if users are allowed to access certain content
 * before rendering it.
 * 
 * Key features:
 * - Authentication check: Redirects unauthenticated users to login
 * - Role-based authorization: Restricts access based on user roles
 * - Loading states: Shows feedback during redirects
 * - Automatic navigation: Handles redirects without user intervention
 * 
 * Usage patterns:
 * ```jsx
 * // Protect any authenticated page
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * // Protect admin-only pages
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 * 
 * Security concepts:
 * - Defense in depth: Client-side + server-side protection
 * - Graceful degradation: Clear messaging when access is denied
 * - Automatic cleanup: Redirects prevent unauthorized access
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * ProtectedRoute Component Props
 * 
 * Defines the interface for the ProtectedRoute component.
 * TypeScript interface ensures type safety and provides clear documentation.
 */
interface ProtectedRouteProps {
  children: React.ReactNode      // The content to protect (pages, components, etc.)
  requiredRole?: 'user' | 'admin'  // Optional: specific role required to access content
}

/**
 * ProtectedRoute Component
 * 
 * This component implements a route guard pattern that:
 * 1. Checks if user is authenticated
 * 2. Optionally checks if user has required role
 * 3. Redirects unauthorized users appropriately
 * 4. Renders protected content for authorized users
 * 
 * @param children - The content to protect and render
 * @param requiredRole - Optional role requirement ('user' or 'admin')
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // Get authentication state from context
  const { user, isAuthenticated, requiresPasswordChange } = useAuth()
  const router = useRouter()  // Next.js router for navigation

  /**
   * Authentication and Authorization Check
   * 
   * This useEffect runs whenever authentication state changes and handles:
   * 1. Unauthenticated users: Redirect to login page
   * 2. Authenticated but unauthorized: Redirect to dashboard
   * 
   * Why useEffect:
   * - Runs after component renders
   * - Reacts to authentication state changes
   * - Handles navigation side effects
   * - Dependency array ensures it runs when relevant values change
   * 
   * Security flow:
   * - Check authentication first (most restrictive)
   * - Then check authorization (role-based)
   * - Redirect to appropriate fallback pages
   */
  useEffect(() => {
    // First check: Is user authenticated?
    if (!isAuthenticated) {
      // Preserve the current URL for redirect after login
      const currentPath = window.location.pathname
      const redirectUrl = `/login?returnUrl=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
      return
    }

    // Second check: Does user need to change password?
    if (requiresPasswordChange && window.location.pathname !== '/change-password') {
      // Redirect to password change page with current path as return URL
      const currentPath = window.location.pathname
      router.push(`/change-password?required=true&returnUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    // Third check: Does user have required role?
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/dashboard')  // Redirect to dashboard (safe fallback)
      return
    }
  }, [isAuthenticated, user, requiredRole, requiresPasswordChange, router])  // Re-run when these values change

  /**
   * Render Logic - Progressive Security Checks
   * 
   * The component renders different content based on authentication state:
   * 1. Not authenticated: Show "Redirecting to login" message
   * 2. Wrong role: Show "Access denied" message
   * 3. Authorized: Render the protected content
   * 
   * Why show loading messages:
   * - Provides user feedback during redirects
   * - Prevents flash of unauthorized content
   * - Better user experience than blank screen
   * 
   * Security considerations:
   * - Never render protected content for unauthorized users
   * - Always show appropriate feedback
   * - Handle edge cases gracefully
   */
  
  // Case 1: User not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  // Case 2: User needs to change password
  if (requiresPasswordChange && window.location.pathname !== '/change-password') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Password change required. Redirecting...</div>
      </div>
    )
  }

  // Case 3: User authenticated but lacks required role
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Access denied. Redirecting...</div>
      </div>
    )
  }

  // Case 4: User is authenticated and authorized - render protected content
  return <>{children}</>
}