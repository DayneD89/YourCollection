import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DynamicForm from './forms/DynamicForm';
import FormLoadingSkeleton from './FormLoadingSkeleton';

const SurveyForm = () => {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Fetch form schema when token is available
  useEffect(() => {
    if (token && user) {
      fetchFormSchema();
    }
  }, [token, user]);

  const fetchFormSchema = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/forms/schema`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch form schema: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSchema(data.data);
      } else {
        throw new Error(data.message || 'Failed to load form schema');
      }
    } catch (err) {
      console.error('Error fetching form schema:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      setSubmitMessage(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/forms/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage({
          type: 'success',
          message: data.message || 'Form submitted successfully!'
        });
      } else {
        throw new Error(data.message || 'Failed to submit form');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitMessage({
        type: 'error',
        message: err.message
      });
    }
  };

  // Handle form refresh
  const handleFormRefresh = () => {
    setSubmitMessage(null);
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Survey Form
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Logged in as: {user?.email || 'Loading...'} ({user?.role || 'Loading...'})
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-3xl mx-auto">
            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">Error Loading Form</h3>
                    <p className="text-sm">{error}</p>
                    <button 
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm" 
                      onClick={fetchFormSchema}
                    >
                      Try Again
                    </button>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="text-red-700 hover:text-red-900 text-xl font-bold"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Submit Message Display */}
            {submitMessage && (
              <div className={`px-4 py-3 rounded mb-6 ${
                submitMessage.type === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">
                      {submitMessage.type === 'success' ? 'Success!' : 'Error'}
                    </h3>
                    <p className="text-sm">{submitMessage.message}</p>
                  </div>
                  <button 
                    onClick={() => setSubmitMessage(null)}
                    className="text-current hover:opacity-75 text-xl font-bold"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <DynamicForm
                schema={schema}
                onSubmit={handleFormSubmit}
                onRefresh={handleFormRefresh}
                loading={loading}
              />
            </div>

            {/* Success Info */}
            {submitMessage?.type === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-green-800 mb-2">Form Submitted Successfully</h3>
                <p className="text-green-700 text-sm mb-2">Your data has been recorded and saved to the database.</p>
                <p className="text-green-600 text-xs">
                  <strong>Note:</strong> This data is now available for analysis by administrators.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyForm;