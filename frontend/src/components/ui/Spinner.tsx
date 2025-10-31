import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'text-[var(--cin7-hept-blue,#0033A0)]',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label={label || 'Loading'}
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      )}
    </div>
  );
};

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div
      className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}
      role="alertdialog"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4 bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <Spinner size="xl" color="primary" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{message}</p>
          <p className="text-sm text-gray-500 mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

export interface InlineSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  message,
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Spinner size={size} color="primary" />
      {message && (
        <p className="text-gray-600">{message}</p>
      )}
    </div>
  );
};
