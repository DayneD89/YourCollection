import React from 'react';
import BaseFieldWrapper from './BaseFieldWrapper';

const TextField = ({ 
  field, 
  value, 
  onChange, 
  onBlur,
  error 
}) => {
  const handleChange = (e) => {
    onChange(field.name, e.target.value);
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(field.name);
    }
  };

  return (
    <BaseFieldWrapper field={field} error={error}>
      <input
        type={field.type === 'email' ? 'email' : 'text'}
        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400 ${
          error ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500' : 'bg-white'
        }`}
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={field.placeholder || ''}
        required={field.required}
      />
    </BaseFieldWrapper>
  );
};

export default TextField;