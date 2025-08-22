/**
 * Inline Loading Component
 * 
 * Smaller loading indicator for inline use within forms, buttons, and content areas.
 * Provides contextual loading states without taking over the entire page.
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InlineLoadingProps {
  message?: string;
  size?: 'small' | 'medium';
  alignment?: 'left' | 'center' | 'right';
  className?: string;
  showSpinner?: boolean;
}

const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = 'Loading...',
  size = 'small',
  alignment = 'left',
  className = '',
  showSpinner = true
}) => {
  const alignmentClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right'
  };

  return (
    <div className={`flex items-center space-x-2 ${alignmentClasses[alignment]} ${className}`}>
      {showSpinner && <LoadingSpinner size={size} color="primary" />}
      <span className={`text-gray-600 ${size === 'small' ? 'text-sm' : 'text-base'}`}>
        {message}
      </span>
    </div>
  );
};

export default InlineLoading;