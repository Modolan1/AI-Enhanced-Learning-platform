import AppShell from '../components/layout/AppShell';

const navItems = [
  { path: '/instructor/dashboard', label: 'Dashboard' },
  { path: '/instructor/profile', label: 'Profile' },
  { path: '/instructor/content', label: 'Manage Content' },
];

export default function InstructorLayout({ children }) {
  return <AppShell navItems={navItems} title="Instructor Panel">{children}</AppShell>;
}
