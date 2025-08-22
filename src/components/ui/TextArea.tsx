import React from "react";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    const textareaClasses = `flex min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm lg:text-base ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y ${className} ${error ? "border-red-300 focus:ring-red-500" : "hover:border-gray-400"
      }`;

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <textarea ref={ref} className={textareaClasses} {...props} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
