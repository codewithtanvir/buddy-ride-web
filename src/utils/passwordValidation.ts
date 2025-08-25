// Password validation utilities with enhanced security
// Provides client-side validation and integrates with Supabase password strength function

import { supabase } from '../lib/supabase';

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  max_score: number;
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  issues: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special_character: boolean;
    not_common: boolean;
    not_sequential: boolean;
    not_repeated: boolean;
  };
}

/**
 * Validates password strength using the Supabase function
 */
export async function validatePasswordStrength(password: string): Promise<PasswordValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_password_strength' as any, {
      password_input: password
    });

    if (error) {
      console.error('Password validation error:', error);
      // Fallback to client-side validation
      return validatePasswordClientSide(password);
    }

    return data as PasswordValidationResult;
  } catch (error) {
    console.error('Password validation error:', error);
    // Fallback to client-side validation
    return validatePasswordClientSide(password);
  }
}

/**
 * Client-side password validation as fallback
 */
export function validatePasswordClientSide(password: string): PasswordValidationResult {
  const issues: string[] = [];
  let score = 0;

  // Length check
  const lengthCheck = password.length >= 8;
  if (lengthCheck) {
    score++;
  } else {
    issues.push('Password must be at least 8 characters long');
  }

  // Uppercase check
  const uppercaseCheck = /[A-Z]/.test(password);
  if (uppercaseCheck) {
    score++;
  } else {
    issues.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  const lowercaseCheck = /[a-z]/.test(password);
  if (lowercaseCheck) {
    score++;
  } else {
    issues.push('Password must contain at least one lowercase letter');
  }

  // Number check
  const numberCheck = /[0-9]/.test(password);
  if (numberCheck) {
    score++;
  } else {
    issues.push('Password must contain at least one number');
  }

  // Special character check
  const specialCheck = /[^a-zA-Z0-9]/.test(password);
  if (specialCheck) {
    score++;
  } else {
    issues.push('Password must contain at least one special character');
  }

  // Common patterns check
  const commonPatterns = /password|123456|qwerty|admin|user|login|welcome|abc123|letmein|monkey|dragon|master|sunshine|princess|football|baseball|superman|iloveyou|trustno1/i;
  const notCommonCheck = !commonPatterns.test(password);
  if (notCommonCheck) {
    score++;
  } else {
    issues.push('Password contains common patterns - choose something more unique');
  }

  // Sequential check
  const sequentialCheck = !/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i.test(password);
  if (sequentialCheck) {
    score++;
  } else {
    issues.push('Password should not contain sequential characters');
  }

  // Repeated character check
  const repeatedCheck = !/(.)\1{2,}/.test(password);
  if (repeatedCheck) {
    score++;
  } else {
    issues.push('Password should not contain repeated characters');
  }

  const strength = getPasswordStrength(score);

  return {
    valid: score >= 6 && issues.length === 0,
    score,
    max_score: 8,
    strength,
    issues,
    checks: {
      length: lengthCheck,
      uppercase: uppercaseCheck,
      lowercase: lowercaseCheck,
      number: numberCheck,
      special_character: specialCheck,
      not_common: notCommonCheck,
      not_sequential: sequentialCheck,
      not_repeated: repeatedCheck,
    },
  };
}

/**
 * Get password strength label based on score
 */
function getPasswordStrength(score: number): PasswordValidationResult['strength'] {
  if (score >= 7) return 'very_strong';
  if (score >= 6) return 'strong';
  if (score >= 4) return 'moderate';
  if (score >= 2) return 'weak';
  return 'very_weak';
}

/**
 * Get strength color for UI display
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very_strong':
      return 'text-green-600';
    case 'strong':
      return 'text-green-500';
    case 'moderate':
      return 'text-yellow-500';
    case 'weak':
      return 'text-orange-500';
    case 'very_weak':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get strength progress percentage for UI
 */
export function getStrengthProgress(score: number, maxScore: number): number {
  return Math.round((score / maxScore) * 100);
}

/**
 * Log password validation attempt (for security monitoring)
 */
export async function logPasswordValidation(result: PasswordValidationResult): Promise<void> {
  try {
    // Only log if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase as any).from('password_validation_log').insert({
      user_id: user.id,
      validation_result: result,
      ip_address: null, // Will be populated by triggers if available
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.warn('Failed to log password validation:', error);
    // Don't throw error as this is just for monitoring
  }
}

/**
 * Check if password meets minimum security requirements
 */
export function meetsMinimumRequirements(result: PasswordValidationResult): boolean {
  return result.valid && result.score >= 6;
}

/**
 * Generate password strength feedback for UI
 */
export function getPasswordFeedback(result: PasswordValidationResult): {
  message: string;
  color: string;
  progress: number;
} {
  const progress = getStrengthProgress(result.score, result.max_score);
  const color = getStrengthColor(result.strength);

  let message = '';
  switch (result.strength) {
    case 'very_strong':
      message = 'Excellent! Your password is very strong.';
      break;
    case 'strong':
      message = 'Good! Your password is strong.';
      break;
    case 'moderate':
      message = 'Your password is moderate. Consider improving it.';
      break;
    case 'weak':
      message = 'Your password is weak. Please strengthen it.';
      break;
    case 'very_weak':
      message = 'Your password is very weak. Please choose a stronger password.';
      break;
  }

  return { message, color, progress };
}
