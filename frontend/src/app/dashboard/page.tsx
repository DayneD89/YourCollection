'use client'

import { useAuth, User } from '@/contexts/AuthContext'

interface ExtendedUser extends User {
  last_login_at?: string
}
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/utils/logger'
// import LoadingPage from '@/components/LoadingPage'
// import InlineLoading from '@/components/InlineLoading'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    logger.component('DashboardPage', 'mount')
    logger.debug('Dashboard loaded for user', { userId: user?.id, role: user?.role })
  }, [user])

  const handleLogout = () => {
    logger.auth('Logout button clicked', { userId: user?.id })
    logout()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Party Collection PWA
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Logged in as: {user?.email} ({user?.role})
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              {user?.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <UserDashboard />
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function UserDashboard() {
  const router = useRouter()

  const handleSurveyClick = () => {
    router.push('/survey')
  }

  return (
    <div className="text-center">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <strong className="font-bold">Success!</strong>
        <span className="block sm:inline"> You have successfully logged in as a regular user.</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome to the User Dashboard
      </h2>
      <p className="text-gray-600 mb-6">
        Access the party collection survey form to submit your information.
      </p>
      
      {/* Survey Form Access */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Party Collection Survey
        </h3>
        <p className="text-blue-700 mb-4">
          Complete our survey to help us gather information for the party collection.
        </p>
        <button
          onClick={handleSurveyClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Start Survey
        </button>
      </div>

      {/* Information Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-green-800 mb-1">
          Data Collection Ready
        </h4>
        <p className="text-green-700 text-sm">
          The survey form is now active and connected. All submissions will be saved to the database for analysis.
        </p>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { createUser, getUsers, deleteUser, resetPassword, user: currentUser } = useAuth()
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ [field: string]: string }>({})
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    first_name: '',
    last_name: ''
  })

  const loadUsers = useCallback(async () => {
    try {
      logger.debug('Loading users list for admin dashboard')
      const userList = await getUsers()
      setUsers(userList)
      logger.debug('Users loaded successfully', { userCount: userList.length })
    } catch (error) {
      logger.error('Failed to load users', error)
    }
  }, [getUsers])

  useEffect(() => {
    logger.component('AdminDashboard', 'mount')
    loadUsers()
  }, [loadUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setValidationErrors({}) // Clear any previous validation errors

    logger.form('AdminCreateUserForm', 'submit', formData)

    try {
      const result = await createUser(formData)
      
      if (result.success) {
        logger.debug('User created successfully in admin dashboard', { email: formData.email })
        setMessage({ type: 'success', text: 'User created successfully!' })
        setFormData({ email: '', password: '', role: 'user', first_name: '', last_name: '' })
        setValidationErrors({}) // Clear validation errors on success
        setShowForm(false)
        loadUsers() // Refresh user list
      } else {
        logger.debug('User creation failed in admin dashboard', { email: formData.email, error: result.message })
        
        // Check if this is a duplicate email error and highlight the email field
        const errorMessage = result.message || 'Failed to create user'
        setMessage({ type: 'error', text: errorMessage })
        
        // Set field-specific validation errors for highlighting
        if (errorMessage.toLowerCase().includes('already exists') || 
            errorMessage.toLowerCase().includes('duplicate') ||
            errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists')) {
          setValidationErrors({ email: errorMessage })
        }
      }
    } catch (error) {
      logger.error('User creation form error', error)
      setMessage({ type: 'error', text: 'Failed to create user' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      logger.debug('User deletion cancelled by admin', { targetEmail: userEmail })
      return
    }

    setDeleteLoading(userId)
    setMessage(null)
    logger.debug('Admin confirmed user deletion', { targetUserId: userId, targetEmail: userEmail })

    try {
      const result = await deleteUser(userId)
      
      if (result.success) {
        logger.debug('User deleted successfully from admin dashboard', { deletedEmail: userEmail })
        setMessage({ type: 'success', text: 'User deleted successfully!' })
        loadUsers() // Refresh user list
      } else {
        logger.debug('User deletion failed from admin dashboard', { targetEmail: userEmail, error: result.message })
        setMessage({ type: 'error', text: result.message || 'Failed to delete user' })
      }
    } catch (error) {
      logger.error('User deletion error from admin dashboard', error)
      setMessage({ type: 'error', text: 'Failed to delete user' })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to reset password for ${userEmail}? The new password will be "${userEmail.split('@')[0]}".`)) {
      logger.debug('Password reset cancelled by admin', { targetEmail: userEmail })
      return
    }

    setResetLoading(userId)
    setMessage(null)
    logger.debug('Admin confirmed password reset', { targetUserId: userId, targetEmail: userEmail })

    try {
      const result = await resetPassword(userId)
      
      if (result.success) {
        logger.debug('Password reset successfully from admin dashboard', { targetEmail: userEmail })
        console.log('🔍 DASHBOARD DEBUG: Password reset result:', JSON.stringify(result, null, 2))
        console.log('🔍 DASHBOARD DEBUG: Target user email:', userEmail)
        console.log('🔍 DASHBOARD DEBUG: Expected password:', userEmail.split('@')[0])
        console.log('🔍 DASHBOARD DEBUG: Actual password returned:', result.data?.new_password)
        setMessage({ type: 'success', text: `Password reset successfully! New password: ${result.data?.new_password || 'undefined'}` })
      } else {
        logger.debug('Password reset failed from admin dashboard', { targetEmail: userEmail, error: result.message })
        setMessage({ type: 'error', text: result.message || 'Failed to reset password' })
      }
    } catch (error) {
      logger.error('Password reset error from admin dashboard', error)
      setMessage({ type: 'error', text: 'Failed to reset password' })
    } finally {
      setResetLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded mb-6">
        <strong className="font-bold">Admin Dashboard</strong>
        <span className="block sm:inline"> - User Management System</span>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400 ${
                  validationErrors.email 
                    ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value})
                  // Clear validation error when user starts typing
                  if (validationErrors.email) {
                    setValidationErrors({...validationErrors, email: ''})
                  }
                }}
              />
              {validationErrors.email && (
                <div className="invalid-feedback mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin'})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Existing Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {currentUser?.id !== user.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          disabled={resetLoading === user.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resetLoading === user.id ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleteLoading === user.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}