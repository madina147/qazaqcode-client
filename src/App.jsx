import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './components/auth/Login';
import Register from './components/auth/StudentRegister';
import TeacherRegistration from './components/auth/TeacherRegister';
// import Landing from './pages/Landing';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import GroupDetails from './components/group/GroupDetails';
import CreateGroup from './components/group/CreateGroup';
import StudentGroups from './components/group/StudentGroups';

import GroupsList from './components/group/GroupsList';
import CreateTest from './components/tests/CreateTest';
import TestList from './components/tests/TestList';
import TakeTest from './components/tests/TakeTest';
import TestResults from './components/tests/TestResults';
import TeacherTestResults from './components/tests/TeacherTestResults';
import ChatPage from './pages/ChatPage';
import NotFound from './pages/NotFound';
import MaterialsList from './components/materials/MaterialsList';
import CreateMaterial from './components/materials/CreateMaterial';
import MaterialView from './components/materials/MaterialView';
import MaterialProgress from './components/materials/MaterialProgress';
import AssignmentList from './components/assignments/AssignmentList';
import CreateAssignment from './components/assignments/CreateAssignment';
import AssignmentDetail from './components/assignments/AssignmentDetail';
import SubmitSolution from './components/assignments/SubmitSolution';
import SubmissionsList from './components/assignments/SubmissionsList';
import Calendar from './components/calendar/Calendar';
import Ratings from './components/ratings/Ratings';
// import './i18n';
import './App.scss';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <Routes>
              {/* <Route path="/" element={<Landing />} /> */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/student" element={<Register />} />
              <Route path="/register/teacher" element={<TeacherRegistration />} />
              
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard/teacher" element={<RoleBasedRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleBasedRoute>} />
                <Route path="/dashboard/student" element={<RoleBasedRoute allowedRoles={['student']}><StudentDashboard /></RoleBasedRoute>} />
                <Route path="/dashboard" element={<Navigate to="/dashboard/student" replace />} />
                
                <Route path="/my-groups" element={<RoleBasedRoute allowedRoles={['student']}><StudentGroups /></RoleBasedRoute>} />
                <Route path="/groups/create" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateGroup /></RoleBasedRoute>} />
                <Route path="/groups/:id" element={<GroupDetails />} />
                <Route path="/student/group/:id" element={<GroupDetails />} />
                <Route path="/all-groups" element={<RoleBasedRoute allowedRoles={['teacher']}><GroupsList /></RoleBasedRoute>} />
                
                {/* Маршруты для тестов */}
                <Route path="/groups/:groupId/tests" element={<TestList />} />
                <Route path="/groups/:groupId/tests/create" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateTest /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/tests/:testId/take" element={<RoleBasedRoute allowedRoles={['student']}><TakeTest /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/tests/:testId/results" element={<RoleBasedRoute allowedRoles={['teacher']}><TeacherTestResults /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/tests/:testId/result" element={<RoleBasedRoute allowedRoles={['student']}><TestResults /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/tests/:testId/edit" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateTest /></RoleBasedRoute>} />
                
                {/* Маршруты для материалов */}
                <Route path="/groups/:groupId/materials" element={<MaterialsList />} />
                <Route path="/groups/:groupId/materials/create" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateMaterial /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/materials/:materialId" element={<MaterialView />} />
                <Route path="/groups/:groupId/materials/:materialId/edit" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateMaterial /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/materials/:materialId/progress" element={<RoleBasedRoute allowedRoles={['teacher']}><MaterialProgress /></RoleBasedRoute>} />
                
                {/* Маршруты для заданий */}
                <Route path="/groups/:groupId/assignments" element={<AssignmentList />} />
                <Route path="/groups/:groupId/assignments/create" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateAssignment /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/assignments/:assignmentId" element={<AssignmentDetail />} />
                <Route path="/groups/:groupId/assignments/:assignmentId/edit" element={<RoleBasedRoute allowedRoles={['teacher']}><CreateAssignment /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/assignments/:assignmentId/submit" element={<RoleBasedRoute allowedRoles={['student']}><SubmitSolution /></RoleBasedRoute>} />
                <Route path="/groups/:groupId/assignments/:assignmentId/submissions" element={<RoleBasedRoute allowedRoles={['teacher']}><SubmissionsList /></RoleBasedRoute>} />
                
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:recipientId" element={<ChatPage />} />
                
                {/* Маршрут для календаря */}
                <Route path="/calendar" element={<Calendar />} />

                {/* Маршрут для рейтингов */}
                <Route path="/ratings" element={<Ratings />} />

              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;