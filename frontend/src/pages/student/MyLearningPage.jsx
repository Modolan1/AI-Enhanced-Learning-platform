import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

function clampPercent(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function StarRating({ value = 0 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(<span key={i} className="text-amber-400">★</span>);
    } else if (value >= i - 0.5) {
      stars.push(<span key={i} className="text-amber-400">✦</span>);
    } else {
      stars.push(<span key={i} className="text-slate-300">☆</span>);
    }
  }
  return <span className="text-sm">{stars}</span>;
}

export default function MyLearningPage() {
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await studentService.getDashboard();
        const enrolled = (response?.data?.progress || []).filter((item) => item.paymentStatus === 'paid');
        setProgress(enrolled);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load your learning courses.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const total = progress.length;
    const completed = progress.filter((item) => clampPercent(item.completionPercent) >= 100).length;
    const inProgress = progress.filter((item) => {
      const pct = clampPercent(item.completionPercent);
      return pct > 0 && pct < 100;
    }).length;
    return { total, completed, inProgress };
  }, [progress]);

  return (
    <StudentLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">My Learning</h1>
        <p className="mt-1 text-sm text-slate-500">Continue learning directly from your enrolled and paid courses.</p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Enrolled Courses</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</h2></Card>
        <Card><p className="text-sm text-slate-500">In Progress</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.inProgress}</h2></Card>
        <Card><p className="text-sm text-slate-500">Completed</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.completed}</h2></Card>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-slate-500">Loading your enrolled courses...</p>
        </Card>
      )}

      {!loading && !progress.length && (
        <Card>
          <p className="text-sm text-slate-600">You do not have paid enrollments yet.</p>
          <Link to="/student/courses" className="mt-3 inline-block">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      )}

      {!loading && progress.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {progress.map((item) => {
            const course = item.course || {};
            const completion = clampPercent(item.completionPercent);
            const nextModule = Math.min(Number(item.completedModules || 0) + 1, Number(item.totalModules || 0) || 1);
            return (
              <Card key={item._id || course._id}>
                <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">{course.category?.name || 'Course'}</div>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{course.title || 'Untitled course'}</h3>
                <p className="mt-2 text-sm text-slate-600">{course.description || 'Continue your learning journey.'}</p>

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2">
                  {Number(course.rating || 0) > 0 ? (
                    <>
                      <StarRating value={Number(course.rating || 0)} />
                      <span className="text-xs font-semibold text-slate-700">{Number(course.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-slate-500">({course.reviewCount || 0})</span>
                    </>
                  ) : (
                    <span className="text-xs italic text-slate-400">Not rated yet</span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Progress</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${completion}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.completedModules || 0} of {item.totalModules || 0} modules completed</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{completion >= 100 ? 'Completed' : `Next: Module ${nextModule}`}</span>
                  <span>{course.level || 'All levels'}</span>
                </div>

                <Link to={`/student/courses/${course._id}/learn`} className="mt-4 block">
                  <Button className="w-full">{completion >= 100 ? 'Review Course' : 'Continue Learning'}</Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
