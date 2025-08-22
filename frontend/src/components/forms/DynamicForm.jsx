import React, { useState, useEffect } from 'react';
import TextField from './fields/TextField';
import NumberField from './fields/NumberField';
import SliderField from './fields/SliderField';
import BooleanField from './fields/BooleanField';
import FormLoadingSkeleton from '../FormLoadingSkeleton';

const DynamicForm = ({ 
  schema, 
  onSubmit, 
  onRefresh,
  loading = false 
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with default values
  useEffect(() => {
    if (schema && schema.fields) {
      const initialData = {};
      schema.fields.forEach(field => {
        if (field.type === 'boolean') {
          initialData[field.name] = false;
        } else if (field.type === 'slider') {
          initialData[field.name] = field.min || 0;
        } else {
          initialData[field.name] = '';
        }
      });
      setFormData(initialData);
    }
  }, [schema]);

  // Handle field value changes
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName) => {
    const field = schema.fields.find(f => f.name === fieldName);
    const value = formData[fieldName];
    
    if (!field) return;
    
    let fieldError = null;
    
    // Check if required field is empty
    if (field.required) {
      if (field.type === 'boolean') {
        if (!value) {
          fieldError = `${field.label} is required`;
        }
      } else {
        if (!value && value !== 0) {
          fieldError = `${field.label} is required`;
        }
      }
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);
      if (!isValid) {
        fieldError = 'Please enter a valid email address';
      }
    }

    // Number validation
    if (field.type === 'number' && value !== '') {
      if (field.min !== undefined && value < field.min) {
        fieldError = `Value must be at least ${field.min}`;
      }
      if (field.max !== undefined && value > field.max) {
        fieldError = `Value must not exceed ${field.max}`;
      }
    }
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldError
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    schema.fields.forEach(field => {
      const value = formData[field.name];
      
      if (field.required) {
        if (field.type === 'boolean') {
          // For required boolean fields, they must be checked (true)
          if (!value) {
            newErrors[field.name] = `${field.label} is required`;
          }
        } else {
          // For other fields, check if they're empty
          if (!value && value !== 0) {
            newErrors[field.name] = `${field.label} is required`;
          }
        }
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(value);
        if (!isValid) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }

      // Number validation
      if (field.type === 'number' && value !== '') {
        if (field.min !== undefined && value < field.min) {
          newErrors[field.name] = `Value must be at least ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.name] = `Value must not exceed ${field.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      // Clear form on successful submission
      handleRefresh();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle refresh/clear
  const handleRefresh = () => {
    if (schema && schema.fields) {
      const clearedData = {};
      schema.fields.forEach(field => {
        if (field.type === 'boolean') {
          clearedData[field.name] = false;
        } else if (field.type === 'slider') {
          clearedData[field.name] = field.min || 0;
        } else {
          clearedData[field.name] = '';
        }
      });
      setFormData(clearedData);
      setErrors({});
      if (onRefresh) {
        onRefresh();
      }
    }
  };

  // Render individual field based on type
  const renderField = (field) => {
    const fieldProps = {
      field,
      value: formData[field.name],
      onChange: handleFieldChange,
      onBlur: handleFieldBlur,
      error: errors[field.name]
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return <TextField key={field.name} {...fieldProps} />;
      case 'number':
        return <NumberField key={field.name} {...fieldProps} />;
      case 'slider':
        return <SliderField key={field.name} {...fieldProps} />;
      case 'boolean':
        return <BooleanField key={field.name} {...fieldProps} />;
      default:
        return (
          <div key={field.name} className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="font-semibold">Unsupported field type: {field.type}</p>
          </div>
        );
    }
  };

  if (loading) {
    return <FormLoadingSkeleton fieldCount={6} showTitle={true} showDescription={true} />;
  }

  if (!schema || !schema.fields) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <h3 className="font-semibold mb-2">Form Configuration Error</h3>
        <p className="text-sm">Unable to load form schema. Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <div className="dynamic-form">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{schema.title}</h2>
        <p className="text-gray-600">{schema.description}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {schema.fields.map(field => renderField(field))}
        </div>

        <div className="form-actions mt-6 flex space-x-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>

          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh}
            disabled={isSubmitting}
          >
            Refresh
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicForm;