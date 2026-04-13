import AppShell from '../components/layout/AppShell';
const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/documents', label: 'Documents' },
  { path: '/student/videos', label: 'Videos' },
  { path: '/student/courses', label: 'Courses' },
  { path: '/student/flashcards', label: 'Flashcards' },
  { path: '/student/quizzes', label: 'Quizzes' },
  { path: '/student/updates', label: 'Updates' },
  { path: '/student/profile', label: 'Profile' },
];
export default function StudentLayout({ children }) {
  return <AppShell navItems={navItems} title="Student Dashboard">{children}</AppShell>;
}
