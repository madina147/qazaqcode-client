import { 
  createTest, 
  getTestById, 
  updateTest, 
  getAllTests,
  deleteTest,
  submitTestAnswers,
  getTestResults
} from './api';

// Re-export test-related functions with more descriptive names
export const getTests = getAllTests;
export const getTest = getTestById;
export const createNewTest = createTest;
export const updateExistingTest = updateTest;
export const removeTest = deleteTest;
export const submitTest = submitTestAnswers;
export const getResults = getTestResults;

// Export original function names as well
export {
  createTest,
  getTestById,
  updateTest,
  getAllTests,
  deleteTest,
  submitTestAnswers,
  getTestResults
}; 