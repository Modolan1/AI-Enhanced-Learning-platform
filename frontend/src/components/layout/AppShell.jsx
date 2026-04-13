import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BrainCircuit, LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  formatUpdateTime,
  getLastSeenTimestamp,
  getStudentUpdates,
  setLastSeenNow,
} from '../../services/studentUpdatesService';

export default function AppShell({ children, navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [studentUpdates, setStudentUpdates] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationMenuRef = useRef(null);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (!isStudent) return;

    const loadStudentUpdates = async () => {
      try {
        const merged = await getStudentUpdates();
        const validLastSeen = getLastSeenTimestamp();
        const unseenCount = merged.filter((item) => item.timestamp > validLastSeen).length;

        setStudentUpdates(merged);
        setNotificationCount(unseenCount);
      } catch (error) {
        console.error('Failed to load student updates:', error);
      }
    };

    loadStudentUpdates();
  }, [isStudent]);

  const visibleUpdates = useMemo(() => studentUpdates.slice(0, 6), [studentUpdates]);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleDocumentClick = (event) => {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationOpen]);

  const handleNotificationToggle = () => {
    const next = !isNotificationOpen;
    setIsNotificationOpen(next);

    if (next) {
      setLastSeenNow();
      setNotificationCount(0);
    }
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-72 flex-col border-r border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 p-6 text-white md:flex">
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-900 shadow-md">
              <BrainCircuit size={20} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">LearnWithAI</h1>
          </div>
          <p className="mt-1 text-sm text-slate-300">{title}</p>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.45)] backdrop-blur">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{user?.firstName} {user?.lastName} • {user?.role}</p>
          </div>
          <div className="flex items-center gap-3">
            {isStudent && (
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="absolute right-0 z-30 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
                      <p className="text-sm font-semibold text-slate-900">Updates</p>
                      <span className="text-xs text-slate-500">Instructor & Admin</span>
                    </div>

                    {!visibleUpdates.length && (
                      <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No updates yet.</p>
                    )}

                    <div className="max-h-80 space-y-2 overflow-auto pr-1">
                      {visibleUpdates.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{item.source}</p>
                            <p className="text-[11px] text-slate-500">{formatUpdateTime(item.rawDate)}</p>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-600">{item.message}</p>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/student/updates"
                      onClick={() => setIsNotificationOpen(false)}
                      className="mt-3 block rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:from-teal-700 hover:to-cyan-700"
                    >
                      View all updates
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={16} /> Logout
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 font-bold text-teal-700">{user?.firstName?.[0] || 'U'}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
