import AppShell from '../components/layout/AppShell';
const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/profile', label: 'Profile' },
  { path: '/admin/admins', label: 'Manage Admins' },
  { path: '/admin/instructors', label: 'Manage Instructors' },
  { path: '/admin/categories', label: 'Manage Categories' },
  { path: '/admin/courses', label: 'Manage Courses' },
  { path: '/admin/quizzes', label: 'Manage Quizzes' },
  { path: '/admin/flashcards', label: 'Manage Flashcards' },
  { path: '/admin/analytics', label: 'Category Analytics' },
  { path: '/admin/students', label: 'Students' },
];
export default function AdminLayout({ children }) {
  return <AppShell navItems={navItems} title="Admin Dashboard">{children}</AppShell>;
}
