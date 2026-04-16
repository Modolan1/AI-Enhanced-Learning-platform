import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [courseAccessById, setCourseAccessById] = useState(new Map());
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  
  useEffect(() => { 
    const fetchData = async () => {
      try {
        const [coursesRes, dashboardRes] = await Promise.all([
          studentService.getCourses(),
          studentService.getDashboard(),
        ]);
        setError(null);
        setCourses(coursesRes.data || []);
        
        const access = new Map();
        (dashboardRes.data?.progress || []).forEach(p => {
          if (p.course?._id) {
            access.set(p.course._id, {
              isEnrolled: true,
              isPaid: p.paymentStatus === 'paid',
            });
          }
        });
        setCourseAccessById(access);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError('Failed to load courses');
      }
    };
    fetchData();
  }, []);

  const categoryOptions = [...new Set(courses.map((course) => course.category?.name).filter(Boolean))];

  const visibleCourses = courses
    .filter((course) => {
      const bySearch = !search.trim() || `${course.title} ${course.description}`.toLowerCase().includes(search.toLowerCase());
      const byLevel = levelFilter === 'all' || course.level === levelFilter;
      const byCategory = categoryFilter === 'all' || course.category?.name === categoryFilter;
      return bySearch && byLevel && byCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'duration') return (a.durationHours || 0) - (b.durationHours || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <StudentLayout>
      {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Course Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">Explore, filter, and enroll in guided learning paths</p>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or description"
          />
          <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="all">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="latest">Sort: Latest</option>
            <option value="title">Sort: Title</option>
            <option value="duration">Sort: Duration</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleCourses.map((course) => (
          <Card key={course._id}>
            {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="h-40 w-full rounded-xl object-cover" /> : null}
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">{course.category?.name}</div>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{course.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{course.description}</p>
            <div className="mt-4 text-sm text-slate-500">{course.level} • {course.durationHours} hour(s) • {course.modules?.length || 0} modules</div>
            {courseAccessById.get(course._id)?.isPaid && (
              <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                ✓ Enrolled & Paid (Access Active)
              </div>
            )}
            {courseAccessById.get(course._id)?.isEnrolled && !courseAccessById.get(course._id)?.isPaid && (
              <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Payment Pending - Complete payment to unlock lessons and materials
              </div>
            )}
            {courseAccessById.get(course._id)?.isPaid ? (
              <Link to={`/student/courses/${course._id}/learn`}><Button className="mt-4 w-full">Continue Learning</Button></Link>
            ) : (
              <Link to={`/student/courses/${course._id}`}><Button className="mt-4 w-full">View Course Details</Button></Link>
            )}
          </Card>
        ))}
      </div>
      {!visibleCourses.length && <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">No courses match your current filters.</div>}
    </StudentLayout>
  );
}
