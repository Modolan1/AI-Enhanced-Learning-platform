import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function ModuleStatusIcon({ completed }) {
  if (completed) {
    return (
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
    </span>
  );
}

export default function MyCourseOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [otherCourses, setOtherCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([
      studentService.getCourseDetail(id),
      studentService.getCourses(),
    ]).then(([courseRes, coursesRes]) => {
      if (courseRes.status !== 'fulfilled') {
        setError('Failed to load course');
        return;
      }
      const courseData = courseRes.value.data;

      // If not enrolled + paid, redirect back to course detail page
      if (!courseData.access?.isPaid) {
        navigate(`/student/courses/${id}`, { replace: true });
        return;
      }

      setData(courseData);

      if (coursesRes.status === 'fulfilled') {
        const all = coursesRes.value.data || [];
        setOtherCourses(all.filter((c) => c._id !== id).slice(0, 6));
      }
    });
  }, [id, navigate]);

  if (error) {
    return (
      <StudentLayout>
        <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>
      </StudentLayout>
    );
  }

  if (!data) {
    return (
      <StudentLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </StudentLayout>
    );
  }

  const { course, progress, quizzes = [] } = data;
  const modules = course.modules || [];
  const completionPercent = progress?.completionPercent ?? 0;
  const completedModules = progress?.completedModules ?? 0;
  const totalModules = progress?.totalModules ?? modules.length;
  const thumbnailUrl = resolveAssetUrl(course.thumbnail);

  // Determine resume lesson index (first incomplete module)
  const resumeIndex = Math.min(completedModules, modules.length - 1);

  return (
    <StudentLayout>
      {/* ── Hero ── */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900" />
        )}

        <div className="relative px-8 py-12 lg:max-w-2xl">
          {course.category?.name && (
            <span className="inline-block rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              {course.category.name}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white lg:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-300 line-clamp-3">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {totalModules} lessons
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.durationHours} hour(s)
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {course.level}
            </span>
          </div>

          {/* ── Progress bar ── */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white">
                {completionPercent === 0
                  ? 'Not started yet'
                  : completionPercent === 100
                    ? 'Course completed!'
                    : `${completionPercent}% complete`}
              </span>
              <span className="text-slate-400">{completedModules} / {totalModules} lessons</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* ── CTA button ── */}
          <div className="mt-6">
            {modules.length > 0 ? (
              <Link to={`/student/courses/${id}/lessons/${resumeIndex}`}>
                <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  {completionPercent === 0 ? 'Get Started' : completionPercent === 100 ? 'Review Course' : 'Continue Learning'}
                </button>
              </Link>
            ) : (
              <button disabled className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-7 py-3 text-base font-semibold text-slate-300 cursor-not-allowed">
                No lessons yet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Curriculum */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Course Content</h2>
              <span className="text-sm text-slate-500">{totalModules} lessons · {course.durationHours} hours</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {modules.map((module, idx) => {
                const isCompleted = idx < completedModules;
                const isCurrent = idx === resumeIndex && completionPercent < 100;
                return (
                  <li key={idx} className={`flex items-center gap-4 px-6 py-4 transition ${isCurrent ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    <ModuleStatusIcon completed={isCompleted} />
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {idx + 1}. {module.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400 capitalize">
                        {module.type} · {module.durationMinutes} min
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        Up next
                      </span>
                    )}
                    <Link
                      to={`/student/courses/${id}/lessons/${idx}`}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isCompleted ? 'Replay' : 'Start'}
                    </Link>
                  </li>
                );
              })}
              {modules.length === 0 && (
                <li className="px-6 py-8 text-center text-sm text-slate-500">
                  No lessons have been added to this course yet.
                </li>
              )}
            </ul>
          </div>

          {/* Quizzes */}
          {quizzes.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">Quizzes</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {quizzes.map((quiz) => (
                  <li key={quiz._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">{quiz.title}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{quiz.questions?.length || 0} questions · {quiz.difficulty}</div>
                    </div>
                    <Link to="/student/quizzes" className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                      Take Quiz
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Stats card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Your Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Completion</span>
                  <span className="font-semibold text-slate-900">{completionPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Lessons done</span>
                <span className="font-bold text-slate-900">{completedModules} / {totalModules}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Quizzes</span>
                <span className="font-bold text-slate-900">{quizzes.length}</span>
              </div>
              {completionPercent === 100 && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                  🎉 Course Completed!
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-slate-900">Quick Access</h3>
            <div className="space-y-2">
              <Link to={`/student/courses/${id}`} className="flex items-center gap-2 rounded-xl p-3 text-sm text-slate-600 transition hover:bg-slate-50">
                <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Course Details
              </Link>
              <Link to="/student/flashcards" className="flex items-center gap-2 rounded-xl p-3 text-sm text-slate-600 transition hover:bg-slate-50">
                <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Flashcards
              </Link>
              <Link to="/student/quizzes" className="flex items-center gap-2 rounded-xl p-3 text-sm text-slate-600 transition hover:bg-slate-50">
                <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Quizzes
              </Link>
              <Link to="/student/study-helper" className="flex items-center gap-2 rounded-xl p-3 text-sm text-slate-600 transition hover:bg-slate-50">
                <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Study Helper
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Other Courses ── */}
      {otherCourses.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Explore More Courses</h2>
            <Link to="/student/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {otherCourses.map((c) => {
              const thumb = resolveAssetUrl(c.thumbnail);
              return (
                <div key={c._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  {thumb ? (
                    <img src={thumb} alt={c.title} className="h-40 w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-200">
                      <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    {c.category?.name && (
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{c.category.name}</div>
                    )}
                    <h3 className="mt-1 font-bold text-slate-900 line-clamp-2">{c.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{c.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span>{c.level}</span>
                      <span>·</span>
                      <span>{c.durationHours}h</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {c.currency || 'USD'} {Number(c.price || 0).toFixed(2)}
                      </span>
                      <Link
                        to={`/student/courses/${c._id}`}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </StudentLayout>
  );
}
