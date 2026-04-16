import AppShell from '../components/layout/AppShell';
const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/my-learning', label: 'My Learning' },
  { path: '/student/documents', label: 'Documents' },
  { path: '/student/courses', label: 'Courses' },
  { path: '/student/flashcards', label: 'Flashcards' },
  { path: '/student/quizzes', label: 'Quizzes' },
  { path: '/student/profile', label: 'Profile' },
];
export default function StudentLayout({ children }) {
  return <AppShell navItems={navItems} title="Student Dashboard">{children}</AppShell>;
}
