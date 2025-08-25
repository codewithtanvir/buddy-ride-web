/**
 * Test file to verify student ID extraction functionality
 * You can run this in the browser console or as a Node.js script
 */

import { extractStudentIdFromEmail, canExtractStudentId, isStudentIdFromEmail } from './studentIdExtractor';

// Test cases for student ID extraction
const testCases = [
  // Valid cases
  { email: "23-51455-1@student.aiub.edu", expected: "23-51455-1", description: "Valid AIUB student email" },
  { email: "22-12345-2@student.aiub.edu", expected: "22-12345-2", description: "Another valid format" },
  { email: "24-98765-3@student.aiub.edu", expected: "24-98765-3", description: "Future year student" },
  
  // Invalid cases
  { email: "invalid@student.aiub.edu", expected: null, description: "Invalid student ID format" },
  { email: "23-51455-1@gmail.com", expected: null, description: "Wrong domain" },
  { email: "23-51455@student.aiub.edu", expected: null, description: "Missing last digit" },
  { email: "2351455-1@student.aiub.edu", expected: null, description: "Missing first dash" },
  { email: "23-514551@student.aiub.edu", expected: null, description: "Missing second dash" },
  { email: "", expected: null, description: "Empty email" },
  { email: "not-an-email", expected: null, description: "Not an email" },
];

export const runStudentIdExtractionTests = () => {
  console.log("🧪 Running Student ID Extraction Tests...\n");
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = extractStudentIdFromEmail(testCase.email);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Email: "${testCase.email}" → Student ID: "${result}"`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Email: "${testCase.email}"`);
      console.log(`   Expected: "${testCase.expected}", Got: "${result}"`);
    }
    console.log("");
  });
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  // Test additional helper functions
  console.log(`\n🔍 Testing Helper Functions:`);
  
  const testEmail = "23-51455-1@student.aiub.edu";
  const testStudentId = "23-51455-1";
  
  console.log(`canExtractStudentId("${testEmail}"): ${canExtractStudentId(testEmail)}`);
  console.log(`isStudentIdFromEmail("${testEmail}", "${testStudentId}"): ${isStudentIdFromEmail(testEmail, testStudentId)}`);
  console.log(`isStudentIdFromEmail("${testEmail}", "22-12345-1"): ${isStudentIdFromEmail(testEmail, "22-12345-1")}`);
  
  return { passed, failed, total: testCases.length };
};

// Export for use in other files
export { testCases };
