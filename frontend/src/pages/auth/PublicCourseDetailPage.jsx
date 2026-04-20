import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '';
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  return `${apiOrigin}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
}

function buildCourseOutcomeLine(course) {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const projectCount = modules.filter((item) => item?.type === 'project').length;
  const lessonCount = modules.length;
  const levelText = (course?.level || 'Beginner').toLowerCase();

  const projectPhrase = `${projectCount || 1} ${projectCount === 1 ? 'project' : 'projects'}`;
  const lessonPhrase = `${lessonCount || 0} ${lessonCount === 1 ? 'lesson' : 'lessons'}`;

  return `Build ${projectPhrase} • ${lessonPhrase} • ${levelText} friendly`;
}

export default function PublicCourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const response = await authService.getPublishedCourses();
        const matchedCourse = (response?.data || []).find((item) => String(item?._id) === String(id));
        if (!matchedCourse) {
          setError('Course not found or no longer published.');
          setCourse(null);
          return;
        }
        setCourse(matchedCourse);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load course details right now.');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const sortedModules = useMemo(() => (course?.modules || []).filter((module) => module?.title), [course]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e2e8f0)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-medium text-slate-600 transition hover:text-indigo-700"
          >
            Home
          </button>
          <span className="text-slate-400">/</span>
          <button
            type="button"
            onClick={() => navigate('/', { state: { returnToCourses: true } })}
            className="font-medium text-slate-600 transition hover:text-indigo-700"
          >
            Courses
          </button>
          <span className="text-slate-400">/</span>
          <span className="max-w-full truncate font-semibold text-slate-800">
            {course?.title || 'Course Details'}
          </span>
        </nav>

        <button
          type="button"
          onClick={() => navigate('/', { state: { returnToCourses: true } })}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Landing Page
        </button>

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500 shadow-md">
            Loading course details...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-md">
            <p className="text-sm text-rose-600">{error}</p>
            <Button className="mt-4" onClick={() => navigate('/', { state: { returnToCourses: true } })}>Back to Landing</Button>
          </div>
        )}

        {!loading && course && (
          <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-xl">
            {course.thumbnail ? (
              <img
                src={getThumbnailUrl(course.thumbnail)}
                alt={course.title}
                className="h-64 w-full object-cover md:h-80"
              />
            ) : null}

            <div className="space-y-6 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">{course.category?.name || 'General'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{course.level}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{course.durationHours || 0}h total</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{course.modules?.length || 0} modules</span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">{course.title}</h1>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  {course.description || 'This course is designed to help you build practical skills through guided lessons and structured modules.'}
                </p>
                <p className="mt-3 text-sm font-semibold text-indigo-700">{buildCourseOutcomeLine(course)}</p>
              </div>

              {course.overviewNotes ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Why this course works</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{course.overviewNotes}</p>
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">What you will learn</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {sortedModules.slice(0, 8).map((module) => (
                    <li key={`${module.title}-${module.durationMinutes}`}>{module.title}</li>
                  ))}
                  {!sortedModules.length && (
                    <li>Foundational concepts, guided practice, and real-world application.</li>
                  )}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Learner trust</p>
                  {Number(course.rating || 0) > 0 ? (
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      Rated {Number(course.rating || 0).toFixed(1)} / 5 by {course.reviewCount || 0} learner{course.reviewCount === 1 ? '' : 's'}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-700">New course, early learners can get ahead quickly.</p>
                  )}
                </div>
                <p className="text-xl font-extrabold text-slate-900">${Number(course.price || 0).toFixed(2)}</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/', { state: { returnToCourses: true } })}>Back to Landing</Button>
                <Button onClick={() => navigate('/register')}>Enroll in This Course</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
