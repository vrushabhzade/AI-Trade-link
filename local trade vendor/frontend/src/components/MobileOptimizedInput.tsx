import React, { useRef, useEffect } from 'react';
import { getInputType, getInputMode, getAutocomplete, scrollIntoViewOnFocus } from '../utils/mobileKeyboard';

interface MobileOptimizedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  fieldType?: 'email' | 'phone' | 'number' | 'decimal' | 'url' | 'search' | 'password' | 'text';
  fieldName?: string;
  label?: string;
  error?: string;
  scrollOnFocus?: boolean;
}

const MobileOptimizedInput: React.FC<MobileOptimizedInputProps> = ({
  fieldType = 'text',
  fieldName,
  label,
  error,
  scrollOnFocus = true,
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollOnFocus && inputRef.current) {
      const handleFocus = () => {
        if (inputRef.current) {
          scrollIntoViewOnFocus(inputRef.current);
        }
      };

      inputRef.current.addEventListener('focus', handleFocus);
      return () => {
        inputRef.current?.removeEventListener('focus', handleFocus);
      };
    }
  }, [scrollOnFocus]);

  const inputType = getInputType(fieldType);
  const inputMode = getInputMode(fieldType);
  const autocomplete = fieldName ? getAutocomplete(fieldName) : 'off';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={inputType}
        inputMode={inputMode as any}
        autoComplete={autocomplete}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MobileOptimizedInput;
