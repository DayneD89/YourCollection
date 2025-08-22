import React from 'react';
import BaseFieldWrapper from './BaseFieldWrapper';

const NumberField = ({ 
  field, 
  value, 
  onChange, 
  error 
}) => {
  const handleChange = (e) => {
    const numValue = e.target.value === '' ? '' : Number(e.target.value);
    onChange(field.name, numValue);
  };

  return (
    <BaseFieldWrapper field={field} error={error}>
      <input
        type="number"
        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400 ${
          error ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500' : 'bg-white'
        }`}
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={handleChange}
        placeholder={field.placeholder || ''}
        min={field.min}
        max={field.max}
        required={field.required}
      />
    </BaseFieldWrapper>
  );
};

export default NumberField;