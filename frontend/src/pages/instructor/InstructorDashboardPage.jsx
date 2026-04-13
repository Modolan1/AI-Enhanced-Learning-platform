import { useEffect, useState } from 'react';
import InstructorLayout from '../../layouts/InstructorLayout';
import Card from '../../components/common/Card';
import { instructorService } from '../../services/instructorService';

export default function InstructorDashboardPage() {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, coursesRes, studentsRes] = await Promise.all([
          instructorService.getDashboard(),
          instructorService.getMyCourses(),
          instructorService.getStudentsEnrolled(),
        ]);
        setData(dashboardRes.data);
        setCourses(coursesRes.data || []);
        setEnrolledStudents(studentsRes.data || []);
      } catch (err) {
        console.error('Failed to load instructor dashboard:', err);
        setError('Failed to load instructor dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) return <InstructorLayout><div className="text-rose-600">{error}</div></InstructorLayout>;
  if (loading) return <InstructorLayout><div>Loading...</div></InstructorLayout>;
  if (!data) return <InstructorLayout><div>No data available</div></InstructorLayout>;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <InstructorLayout>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Total Content</p><h3 className="mt-2 text-3xl font-bold">{data.stats.totalContent}</h3></Card>
        <Card><p className="text-sm text-slate-500">Videos</p><h3 className="mt-2 text-3xl font-bold">{data.stats.totalVideos}</h3></Card>
        <Card><p className="text-sm text-slate-500">Documents</p><h3 className="mt-2 text-3xl font-bold">{data.stats.totalDocuments}</h3></Card>
        <Card><p className="text-sm text-slate-500">Total Views</p><h3 className="mt-2 text-3xl font-bold">{data.stats.totalViews}</h3></Card>
      </div>

      <div className="mt-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent Uploads</h3>
          <div className="space-y-3">
            {data.recentContent.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-slate-500">{item.contentType} • {item.viewCount} views</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* My Courses Section */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold">My Courses</h3>
          <div className="space-y-3">
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500">No courses created yet</p>
            ) : (
              courses.map((course) => (
                <div key={course._id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.title}</h4>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{course.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {course.enrollmentCount} students
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(course.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Students Enrolled Section */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Students Enrolled</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {enrolledStudents.length === 0 ? (
              <p className="text-sm text-slate-500">No students enrolled yet</p>
            ) : (
              enrolledStudents.map((enrollment) => (
                <div key={enrollment._id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{enrollment.studentName}</h4>
                      <p className="text-xs text-slate-500 truncate">{enrollment.studentEmail}</p>
                      <p className="mt-1 text-xs text-indigo-600 font-medium">{enrollment.courseTitle}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Enrolled: {formatDate(enrollment.enrollmentDate)}</span>
                    <span className="inline-block px-2 py-1 rounded bg-gray-100">
                      {enrollment.completionPercent}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </InstructorLayout>
  );
}
