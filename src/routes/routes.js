// Test components
import TestsList from '../components/tests/TestsList';
import CreateTest from '../components/tests/CreateTest';
import TakeTest from '../components/tests/TakeTest';
import TestResults from '../components/tests/TestResults';
import TestReview from '../components/tests/TestReview';
import TeacherTestResults from '../components/tests/TeacherTestResults';

// Define routes
const routes = [
  // Tests routes
  { path: "/groups/:groupId/tests", element: <TestsList />, private: true },
  { path: "/groups/:groupId/tests/create", element: <CreateTest />, private: true, roles: ['teacher'] },
  { path: "/groups/:groupId/tests/:testId/edit", element: <CreateTest />, private: true, roles: ['teacher'] },
  { path: "/groups/:groupId/tests/:testId/take", element: <TakeTest />, private: true, roles: ['student'] },
  { path: "/groups/:groupId/tests/:testId/results", element: <TeacherTestResults />, private: true, roles: ['teacher'] },
  { path: "/groups/:groupId/tests/:testId/result", element: <TestResults />, private: true, roles: ['student'] },
  { path: "/groups/:groupId/tests/:testId/review", element: <TestReview />, private: true, roles: ['student'] },
]; 