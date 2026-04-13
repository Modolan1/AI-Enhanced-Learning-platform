import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [error, setError] = useState(null);
  
  useEffect(() => { 
    const fetchData = async () => {
      try {
        const [coursesRes, dashboardRes] = await Promise.all([
          studentService.getCourses(),
          studentService.getDashboard(),
        ]);
        setError(null);
        setCourses(coursesRes.data || []);
        
        const enrolled = new Set();
        (dashboardRes.data?.progress || []).forEach(p => {
          if (p.course?._id) {
            enrolled.add(p.course._id);
          }
        });
        setEnrolledCourses(enrolled);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError('Failed to load courses');
      }
    };
    fetchData();
  }, []);

  return (
    <StudentLayout>
      {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Available Courses</h1>
        <p className="mt-1 text-sm text-slate-500">Browse all courses, view details, and enroll to start learning</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course._id}>
            {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="h-40 w-full rounded-xl object-cover" /> : null}
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">{course.category?.name}</div>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{course.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{course.description}</p>
            <div className="mt-4 text-sm text-slate-500">{course.level} • {course.durationHours} hour(s) • {course.modules?.length || 0} modules</div>
            {enrolledCourses.has(course._id) && (
              <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                ✓ Enrolled
              </div>
            )}
            <Link to={`/student/courses/${course._id}`}><Button className="mt-4 w-full">View Course Details</Button></Link>
          </Card>
        ))}
      </div>
    </StudentLayout>
  );
}
