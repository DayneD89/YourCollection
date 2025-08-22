import React from 'react';
import BaseFieldWrapper from './BaseFieldWrapper';

const BooleanField = ({ 
  field, 
  value, 
  onChange, 
  error 
}) => {
  const handleChange = (e) => {
    onChange(field.name, e.target.checked);
  };

  return (
    <BaseFieldWrapper field={field} error={error} showLabel={false} className="flex items-start" descriptionClassName="ml-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
            error ? 'border-red-400 focus:ring-red-500' : ''
          }`}
          id={field.name}
          name={field.name}
          checked={value || false}
          onChange={handleChange}
          required={field.required}
        />
        
        <label className="ml-3 text-sm font-medium text-gray-700" htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    </BaseFieldWrapper>
  );
};

export default BooleanField;