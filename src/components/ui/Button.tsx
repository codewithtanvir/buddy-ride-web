import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-sm";

    const variants = {
      primary:
        "bg-primary-600/90 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg shadow-primary-500/20",
      secondary:
        "bg-gray-100/90 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
      outline:
        "border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 focus:ring-primary-500",
      ghost: "text-gray-700 hover:bg-gray-100/60 focus:ring-gray-500",
    };

    const sizes = {
      sm: "h-10 px-3 text-sm min-h-[40px]", // Improved touch target
      md: "h-11 px-4 text-sm min-h-[44px]", // Standard touch target
      lg: "h-12 px-6 text-base min-h-[48px]", // Large touch target
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeOpacity="0.3"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="20 60"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
