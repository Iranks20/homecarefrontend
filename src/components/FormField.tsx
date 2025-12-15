import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export function InputField({ 
  error, 
  label, 
  required = false, 
  className = '', 
  ...props 
}: InputFieldProps) {
  const inputClasses = `input-field ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${className}`;
  
  const input = (
    <input
      className={inputClasses}
      {...props}
    />
  );

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        {input}
      </FormField>
    );
  }

  return input;
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export function TextAreaField({ 
  error, 
  label, 
  required = false, 
  className = '', 
  ...props 
}: TextAreaFieldProps) {
  const textareaClasses = `input-field ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${className}`;
  
  const textarea = (
    <textarea
      className={textareaClasses}
      {...props}
    />
  );

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        {textarea}
      </FormField>
    );
  }

  return textarea;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ 
  error, 
  label, 
  required = false, 
  options, 
  placeholder, 
  className = '', 
  ...props 
}: SelectFieldProps) {
  const selectClasses = `input-field ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${className}`;
  
  const select = (
    <select
      className={selectClasses}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (label) {
    return (
      <FormField label={label} error={error} required={required}>
        {select}
      </FormField>
    );
  }

  return select;
}
