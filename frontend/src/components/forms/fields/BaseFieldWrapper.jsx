import React from 'react';

/**
 * BaseFieldWrapper - Shared wrapper for all form field components
 * 
 * Provides consistent structure for:
 * - Field labels with required indicators
 * - Field descriptions  
 * - Error message display
 * - Tailwind CSS styling containers
 */
const BaseFieldWrapper = ({ 
  field, 
  error, 
  children,
  className = '',
  labelSuffix = null,
  showLabel = true,
  descriptionClassName = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {showLabel && (
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {labelSuffix}
        </label>
      )}
      
      {children}
      
      {field.description && (
        <div className={`text-sm text-gray-500 mt-1 ${descriptionClassName}`}>
          {field.description}
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default BaseFieldWrapper;