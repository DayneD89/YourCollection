/**
 * Form Loading Skeleton Component
 * 
 * Displays a skeleton placeholder while form schema is being loaded.
 * Provides visual continuity and better user experience during async operations.
 */

import React from 'react';

interface FormLoadingSkeletonProps {
  fieldCount?: number;
  showTitle?: boolean;
  showDescription?: boolean;
  className?: string;
}

const FormLoadingSkeleton: React.FC<FormLoadingSkeletonProps> = ({
  fieldCount = 5,
  showTitle = true,
  showDescription = true,
  className = ''
}) => {
  return (
    <div className={`animate-pulse space-y-6 ${className}`}>
      {showTitle && (
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
        </div>
      )}
      
      {showDescription && (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      )}
      
      <div className="space-y-4">
        {Array.from({ length: fieldCount }, (_, index) => (
          <div key={index} className="space-y-2">
            {/* Field label skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            
            {/* Field input skeleton - vary heights for different field types */}
            <div 
              className={`bg-gray-200 rounded-md ${
                index % 4 === 0 ? 'h-20' : // Textarea
                index % 4 === 1 ? 'h-16' : // Slider
                index % 4 === 2 ? 'h-10 w-24' : // Checkbox
                'h-10' // Regular input
              }`}
            ></div>
            
            {/* Optional helper text skeleton */}
            {index % 3 === 0 && (
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Submit button skeleton */}
      <div className="pt-4">
        <div className="h-12 bg-blue-200 rounded-md w-32"></div>
      </div>
      
      {/* Loading indicator */}
      <div className="flex items-center justify-center pt-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm">Loading form configuration...</span>
        </div>
      </div>
    </div>
  );
};

export default FormLoadingSkeleton;