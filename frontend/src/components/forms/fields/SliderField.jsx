import React from 'react';
import BaseFieldWrapper from './BaseFieldWrapper';

const SliderField = ({ 
  field, 
  value, 
  onChange, 
  onBlur,
  error 
}) => {
  const handleChange = (e) => {
    onChange(field.name, Number(e.target.value));
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(field.name);
    }
  };

  const currentValue = value !== undefined ? value : field.min || 0;

  return (
    <BaseFieldWrapper 
      field={field} 
      error={error}
      labelSuffix={<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-2">{currentValue}</span>}
    >
      <div className="slider-container">
        <div className="flex justify-between text-gray-500 text-sm mb-2">
          <span>{field.min || 0}</span>
          <span>{field.max || 10}</span>
        </div>
        
        <input
          type="range"
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${
            error ? 'border-red-400' : ''
          }`}
          id={field.name}
          name={field.name}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={field.min || 0}
          max={field.max || 10}
          step="1"
          required={field.required}
          style={{
            background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((currentValue - (field.min || 0)) / ((field.max || 10) - (field.min || 0))) * 100}%, #e5e7eb ${((currentValue - (field.min || 0)) / ((field.max || 10) - (field.min || 0))) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
    </BaseFieldWrapper>
  );
};

export default SliderField;