import React from 'react';
import { TextField as PolarisTextField } from '@shopify/polaris';

export interface Cin7TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string, id: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  error?: string | boolean;
  helpText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  type?: 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url' | 'date' | 'datetime-local' | 'month' | 'time' | 'week';
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: boolean | string;
  id?: string;
  name?: string;
  maxLength?: number;
  minLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  autoFocus?: boolean;
  clearButton?: boolean;
  onClearButtonClick?: () => void;
  monospaced?: boolean;
  multiline?: boolean | number;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const Cin7TextField = React.forwardRef<HTMLInputElement, Cin7TextFieldProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      onFocus,
      placeholder,
      error,
      helpText,
      prefix,
      suffix,
      type = 'text',
      disabled,
      readOnly,
      autoComplete,
      id,
      name,
      maxLength,
      minLength,
      min,
      max,
      step,
      pattern,
      autoFocus,
      clearButton,
      onClearButtonClick,
      monospaced,
      multiline,
      className,
      inputRef,
    },
    ref
  ) => {
    const handleChange = (newValue: string, id: string) => {
      if (onChange) {
        onChange(newValue, id);
      }
    };

    return (
      <div className={className}>
        <PolarisTextField
          label={label}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          error={typeof error === 'string' ? error : undefined}
          helpText={helpText}
          prefix={prefix}
          suffix={suffix}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={typeof autoComplete === 'string' ? autoComplete : autoComplete ? 'on' : 'off'}
          id={id}
          name={name}
          maxLength={maxLength}
          minLength={minLength}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          autoFocus={autoFocus}
          clearButton={clearButton}
          onClearButtonClick={onClearButtonClick}
          monospaced={monospaced}
          multiline={multiline}
        />
      </div>
    );
  }
);

Cin7TextField.displayName = 'Cin7TextField';

// Compatibility wrapper for components using the old Input API
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Keeping the same interface as the old Input component for compatibility
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, onBlur, onFocus, placeholder, disabled, readOnly, ...props }, ref) => {
    const handlePolarisChange = (newValue: string) => {
      if (onChange) {
        // Create a synthetic event that matches React's ChangeEvent
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handlePolarisBlur = () => {
      if (onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement>);
      }
    };

    const handlePolarisFocus = () => {
      if (onFocus) {
        onFocus({} as React.FocusEvent<HTMLInputElement>);
      }
    };

    return (
      <Cin7TextField
        type={type as Cin7TextFieldProps['type']}
        value={value as string}
        onChange={handlePolarisChange}
        onBlur={handlePolarisBlur}
        onFocus={handlePolarisFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
      />
    );
  }
);

Input.displayName = 'Input';
