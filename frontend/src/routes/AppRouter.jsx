import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HomeEntryPage from '../pages/auth/HomeEntryPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import ManageAdminsPage from '../pages/admin/ManageAdminsPage';
import ManageCategoriesPage from '../pages/admin/ManageCategoriesPage';
import ManageCoursesPage from '../pages/admin/ManageCoursesPage';
import ManageQuizzesPage from '../pages/admin/ManageQuizzesPage';
import ManageFlashcardsPage from '../pages/admin/ManageFlashcardsPage';
import CategoriesAnalyticsPage from '../pages/admin/CategoriesAnalyticsPage';
import StudentsPage from '../pages/admin/StudentsPage';
import InstructorsPage from '../pages/admin/InstructorsPage';
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import CoursesPage from '../pages/student/CoursesPage';
import CourseDetailPage from '../pages/student/CourseDetailPage';
import FlashcardsPage from '../pages/student/FlashcardsPage';
import QuizzesPage from '../pages/student/QuizzesPage';
import ProfilePage from '../pages/student/ProfilePage';
import DocumentsPage from '../pages/student/DocumentsPage';
import VideosPage from '../pages/student/VideosPage';
import UpdatesPage from '../pages/student/UpdatesPage';
import InstructorDashboardPage from '../pages/instructor/InstructorDashboardPage';
import InstructorProfilePage from '../pages/instructor/InstructorProfilePage';
import ManageContentPage from '../pages/instructor/ManageContentPage';
import InstructorLoginPage from '../pages/auth/InstructorLoginPage';
import InstructorRegisterPage from '../pages/auth/InstructorRegisterPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) {
    const fallbackPath = user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'instructor'
        ? '/instructor/dashboard'
        : '/student/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeEntryPage />} />
      <Route path="/login" element={<HomeEntryPage />} />
      <Route path="/register" element={<HomeEntryPage />} />
      <Route path="/instructor/login" element={<InstructorLoginPage />} />
      <Route path="/instructor/register" element={<InstructorRegisterPage />} />

      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><AdminProfilePage /></ProtectedRoute>} />
      <Route path="/admin/admins" element={<ProtectedRoute roles={['admin']}><ManageAdminsPage /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><ManageCategoriesPage /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><ManageCoursesPage /></ProtectedRoute>} />
      <Route path="/admin/quizzes" element={<ProtectedRoute roles={['admin']}><ManageQuizzesPage /></ProtectedRoute>} />
      <Route path="/admin/flashcards" element={<ProtectedRoute roles={['admin']}><ManageFlashcardsPage /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><CategoriesAnalyticsPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/admin/instructors" element={<ProtectedRoute roles={['admin']}><InstructorsPage /></ProtectedRoute>} />

      <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute roles={['student']}><CoursesPage /></ProtectedRoute>} />
      <Route path="/student/courses/:id" element={<ProtectedRoute roles={['student']}><CourseDetailPage /></ProtectedRoute>} />
      <Route path="/student/flashcards" element={<ProtectedRoute roles={['student']}><FlashcardsPage /></ProtectedRoute>} />
      <Route path="/student/quizzes" element={<ProtectedRoute roles={['student']}><QuizzesPage /></ProtectedRoute>} />
      <Route path="/student/documents" element={<ProtectedRoute roles={['student']}><DocumentsPage /></ProtectedRoute>} />
      <Route path="/student/videos" element={<ProtectedRoute roles={['student']}><VideosPage /></ProtectedRoute>} />
      <Route path="/student/updates" element={<ProtectedRoute roles={['student']}><UpdatesPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute roles={['student']}><ProfilePage /></ProtectedRoute>} />

      <Route path="/instructor/dashboard" element={<ProtectedRoute roles={['instructor']}><InstructorDashboardPage /></ProtectedRoute>} />
      <Route path="/instructor/profile" element={<ProtectedRoute roles={['instructor']}><InstructorProfilePage /></ProtectedRoute>} />
      <Route path="/instructor/content" element={<ProtectedRoute roles={['instructor']}><ManageContentPage /></ProtectedRoute>} />
    </Routes>
  );
}
