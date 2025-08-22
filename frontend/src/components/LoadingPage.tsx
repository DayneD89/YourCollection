/**
 * Loading Page Component
 * 
 * Full-page loading screen with animated graphics and customizable messages.
 * Used during authentication, data fetching, and other async operations.
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingPageProps {
  title?: string;
  message?: string;
  showLogo?: boolean;
  variant?: 'default' | 'authentication' | 'data' | 'form';
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  title = 'Loading',
  message = 'Please wait while we prepare everything for you...',
  showLogo = true,
  variant = 'default'
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'authentication':
        return {
          icon: '🔐',
          bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
          title: title || 'Signing you in',
          message: message || 'Verifying your credentials and setting up your session...'
        };
      case 'data':
        return {
          icon: '📊',
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
          title: title || 'Loading data',
          message: message || 'Fetching the latest information for you...'
        };
      case 'form':
        return {
          icon: '📋',
          bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100',
          title: title || 'Loading form',
          message: message || 'Preparing the form configuration...'
        };
      default:
        return {
          icon: '⚙️',
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-100',
          title,
          message
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className={`min-h-screen flex items-center justify-center ${config.bgColor}`}>
      <div className="text-center p-8 max-w-md w-full mx-4">
        {showLogo && (
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-4">
              <span className="text-3xl" role="img" aria-label="Loading icon">
                {config.icon}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Party Collection
            </h1>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="large" color="primary" />
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {config.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {config.message}
              </p>
            </div>
          </div>

          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
        
        {/* Progress bar animation */}
        <div className="mt-8 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;