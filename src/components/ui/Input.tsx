import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    const inputClasses = `flex h-11 lg:h-12 min-h-[44px] w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-base ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className} ${error ? "border-red-300 focus:ring-red-500" : "hover:border-gray-300"
      }`;

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
