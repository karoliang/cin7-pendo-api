import React from 'react';
import { Select as PolarisSelect } from '@shopify/polaris';

export interface Cin7SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface Cin7SelectProps {
  label?: string;
  labelInline?: boolean;
  labelHidden?: boolean;
  options: Cin7SelectOption[];
  value?: string;
  onChange?: (value: string, id: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  helpText?: string;
  id?: string;
  name?: string;
  className?: string;
}

export const Cin7Select: React.FC<Cin7SelectProps> = ({
  label,
  labelInline,
  labelHidden,
  options,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled,
  error,
  helpText,
  id,
  name,
  className,
}) => {
  const handleChange = (selected: string, id: string) => {
    if (onChange) {
      onChange(selected, id);
    }
  };

  return (
    <div className={className}>
      <PolarisSelect
        label={label || ''}
        labelInline={labelInline}
        labelHidden={labelHidden}
        options={options}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        error={typeof error === 'string' ? error : undefined}
        helpText={helpText}
        id={id}
        name={name}
      />
    </div>
  );
};

Cin7Select.displayName = 'Cin7Select';

// Compatibility wrapper components for Radix UI Select API
export interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
  position?: 'popper' | 'item-aligned';
}

export interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// Context to share select state between compound components
const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  options: Cin7SelectOption[];
  setOptions: (options: Cin7SelectOption[]) => void;
  placeholder?: string;
  setPlaceholder: (placeholder: string) => void;
}>({
  options: [],
  setOptions: () => {},
  setPlaceholder: () => {},
});

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange, defaultValue, disabled, name }) => {
  const [options, setOptions] = React.useState<Cin7SelectOption[]>([]);
  const [placeholder, setPlaceholder] = React.useState<string>('');
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange, options, setOptions, placeholder, setPlaceholder }}>
      <div data-select-wrapper>{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className, disabled }) => {
  // This component is used to trigger the select, but in Polaris it's handled internally
  // We'll render children to capture SelectValue
  return <div className={className}>{children}</div>;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);

  React.useEffect(() => {
    if (placeholder) {
      context.setPlaceholder(placeholder);
    }
  }, [placeholder, context]);

  return null;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  const childArray = React.Children.toArray(children);

  React.useEffect(() => {
    const newOptions: Cin7SelectOption[] = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectItem) {
        const childProps = child.props as any;
        newOptions.push({
          label: typeof childProps.children === 'string' ? childProps.children : childProps.value,
          value: childProps.value,
          disabled: childProps.disabled,
        });
      }
    });

    context.setOptions(newOptions);
  }, [children, context]);

  // Render the actual Polaris Select
  if (context.options.length > 0) {
    return (
      <PolarisSelect
        label=""
        labelHidden
        options={context.options}
        value={context.value}
        onChange={(value) => context.onValueChange?.(value)}
        placeholder={context.placeholder}
      />
    );
  }

  return null;
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, disabled, className }) => {
  // This is a placeholder component that's used to define options
  // The actual rendering is done by SelectContent
  return null;
};

export const SelectLabel: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const SelectGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const SelectSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={className} />;
};

export const SelectScrollUpButton: React.FC<{ className?: string }> = ({ className }) => {
  return null;
};

export const SelectScrollDownButton: React.FC<{ className?: string }> = ({ className }) => {
  return null;
};
