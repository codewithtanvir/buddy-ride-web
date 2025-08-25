/**
 * Utility functions for extracting and validating student IDs from AIUB email addresses
 */

/**
 * Extracts student ID from an AIUB email address
 * @param email - The AIUB student email (e.g., "23-51455-1@student.aiub.edu")
 * @returns The extracted student ID (e.g., "23-51455-1") or null if invalid
 */
export const extractStudentIdFromEmail = (email: string): string | null => {
  // Check if it's a valid AIUB student email
  if (!email || !email.toLowerCase().endsWith("@student.aiub.edu")) {
    return null;
  }

  // Extract the part before @ symbol
  const studentIdPart = email.split("@")[0];
  
  // Validate the student ID format (XX-XXXXX-X)
  const studentIdRegex = /^\d{2}-\d{5}-\d{1}$/;
  
  if (studentIdRegex.test(studentIdPart)) {
    return studentIdPart;
  }

  return null;
};

/**
 * Validates if an email address can have its student ID automatically extracted
 * @param email - The email address to check
 * @returns True if student ID can be extracted, false otherwise
 */
export const canExtractStudentId = (email: string): boolean => {
  return extractStudentIdFromEmail(email) !== null;
};

/**
 * Checks if a student ID appears to be automatically extracted from email
 * @param email - The user's email address
 * @param studentId - The student ID to check
 * @returns True if the student ID matches the email's prefix
 */
export const isStudentIdFromEmail = (email: string, studentId: string): boolean => {
  const extractedId = extractStudentIdFromEmail(email);
  return extractedId === studentId;
};
