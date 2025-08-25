import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertTriangle } from 'lucide-react';
import { 
  validatePasswordStrength, 
  getPasswordFeedback, 
  meetsMinimumRequirements,
  type PasswordValidationResult 
} from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (isValid: boolean, result: PasswordValidationResult) => void;
  showDetails?: boolean;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onValidationChange,
  showDetails = true,
  className = '',
}) => {
  const [result, setResult] = useState<PasswordValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!password) {
      setResult(null);
      onValidationChange?.(false, {} as PasswordValidationResult);
      return;
    }

    const validatePassword = async () => {
      setLoading(true);
      try {
        const validationResult = await validatePasswordStrength(password);
        setResult(validationResult);
        onValidationChange?.(meetsMinimumRequirements(validationResult), validationResult);
      } catch (error) {
        console.error('Password validation failed:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validatePassword, 300);
    return () => clearTimeout(timeoutId);
  }, [password, onValidationChange]);

  if (!password || !result) {
    return null;
  }

  const feedback = getPasswordFeedback(result);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Password Strength</span>
          <span className={`font-semibold ${feedback.color}`}>
            {result.strength.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              result.strength === 'very_weak' ? 'bg-red-500' :
              result.strength === 'weak' ? 'bg-orange-500' :
              result.strength === 'moderate' ? 'bg-yellow-500' :
              result.strength === 'strong' ? 'bg-green-500' :
              'bg-green-600'
            }`}
            style={{ width: `${feedback.progress}%` }}
          />
        </div>
      </div>

      {/* Feedback Message */}
      <div className="flex items-center gap-2">
        <Shield className={`h-4 w-4 ${feedback.color}`} />
        <span className={`text-sm ${feedback.color}`}>
          {feedback.message}
        </span>
      </div>

      {/* Detailed Checks */}
      {showDetails && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            <CheckItem 
              label="At least 8 characters" 
              passed={result.checks.length} 
            />
            <CheckItem 
              label="Uppercase letter" 
              passed={result.checks.uppercase} 
            />
            <CheckItem 
              label="Lowercase letter" 
              passed={result.checks.lowercase} 
            />
            <CheckItem 
              label="Number" 
              passed={result.checks.number} 
            />
            <CheckItem 
              label="Special character" 
              passed={result.checks.special_character} 
            />
            <CheckItem 
              label="Not common pattern" 
              passed={result.checks.not_common} 
            />
            <CheckItem 
              label="No sequential chars" 
              passed={result.checks.not_sequential} 
            />
            <CheckItem 
              label="No repeated chars" 
              passed={result.checks.not_repeated} 
            />
          </div>
        </div>
      )}

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Issues to Fix:
          </h4>
          <ul className="space-y-1">
            {result.issues.map((issue, index) => (
              <li key={index} className="text-xs text-red-600 flex items-start gap-1">
                <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full" />
          Validating password...
        </div>
      )}
    </div>
  );
};

interface CheckItemProps {
  label: string;
  passed: boolean;
}

const CheckItem: React.FC<CheckItemProps> = ({ label, passed }) => {
  return (
    <div className="flex items-center gap-1">
      {passed ? (
        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-3 w-3 text-red-500 flex-shrink-0" />
      )}
      <span className={`text-xs ${passed ? 'text-green-700' : 'text-red-700'}`}>
        {label}
      </span>
    </div>
  );
};
