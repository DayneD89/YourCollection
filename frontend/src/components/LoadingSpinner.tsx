/**
 * Loading Spinner Component
 * 
 * A reusable loading spinner component with customizable size and colors.
 * Uses CSS animations for smooth rotation and provides accessibility features.
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent', 
    white: 'border-white border-t-transparent'
  };

  return (
    <div
      className={`
        inline-block rounded-full animate-spin
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;