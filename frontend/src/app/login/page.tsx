'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'
  
  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(returnUrl)
    }
  }, [isAuthenticated, isLoading, router, returnUrl])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        if (result.requirePasswordChange) {
          // Redirect to password change page
          const issuesParam = result.passwordIssues ? 
            encodeURIComponent(JSON.stringify(result.passwordIssues)) : ''
          const requiredParam = result.requirePasswordChange ? '&required=true' : ''
          router.push(`/change-password?issues=${issuesParam}${requiredParam}&returnUrl=${encodeURIComponent(returnUrl)}`)
        } else {
          // Normal redirect to return URL - let useEffect handle this
        }
      } else {
        const errorMessage = result.error || 'Invalid email or password'
        setError(errorMessage)
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Party Collection</h1>
        <p className="text-gray-600 mb-8">Sign in to your account</p>
        
        {error && (
          <div className="mb-4 text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200" role="alert" id="login-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-left">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}