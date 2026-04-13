import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [instructorContent, setInstructorContent] = useState([]);
  const [courseDocuments, setCourseDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  const resolveAssetUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const load = async () => {
    try {
      setError(null);
      const [result, contentResult, coursesResult] = await Promise.all([
        studentService.getDashboard(),
        studentService.getInstructorContent({ contentType: 'document' }),
        studentService.getCourses(),
      ]);
      setData(result.data);

      const courses = coursesResult.data || [];
      setCourses(courses);
      const categoryToCourses = courses.reduce((acc, course) => {
        const categoryId = String(course?.category?._id || course?.category || '');
        if (!categoryId) return acc;
        if (!acc[categoryId]) acc[categoryId] = [];
        acc[categoryId].push({
          id: String(course._id),
          title: course.title,
        });
        return acc;
      }, {});

      const documents = (contentResult.data || []).map((item) => {
        const categoryId = String(item?.category?._id || item?.category || '');
        const related = categoryToCourses[categoryId] || [];
        return {
          ...item,
          relatedCourses: related.map((course) => course.title),
          relatedCourseIds: related.map((course) => course.id),
          categoryId,
        };
      });

      setInstructorContent(documents);
      setCourseDocuments(documents);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard. Please try again.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedCategoryId === 'all') return;
    const selectedCourseStillValid = courses.some((course) => String(course._id) === selectedCourseId && String(course?.category?._id || course?.category || '') === selectedCategoryId);
    if (!selectedCourseStillValid) {
      setSelectedCourseId('all');
    }
  }, [selectedCategoryId, selectedCourseId, courses]);

  if (error) return <StudentLayout><div className="text-red-600">{error}</div></StudentLayout>;
  if (!data) return <StudentLayout><div>Loading...</div></StudentLayout>;

  const categoryOptions = courses.reduce((acc, course) => {
    const categoryId = String(course?.category?._id || course?.category || '');
    const categoryName = course?.category?.name || 'Uncategorized';
    if (!categoryId) return acc;
    if (!acc.some((item) => item.id === categoryId)) {
      acc.push({ id: categoryId, name: categoryName });
    }
    return acc;
  }, []);

  const courseOptions = courses.filter((course) => {
    if (selectedCategoryId === 'all') return true;
    return String(course?.category?._id || course?.category || '') === selectedCategoryId;
  });

  const filteredDocuments = courseDocuments.filter((item) => {
    const categoryMatch = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const courseMatch = selectedCourseId === 'all' || (item.relatedCourseIds || []).includes(selectedCourseId);
    return categoryMatch && courseMatch;
  });

  const visibleDocuments = filteredDocuments.slice(0, 8);

  return (
    <StudentLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {data.student.firstName}</h1>
          <p className="text-sm text-slate-500">Track progress, flashcards, scores, AI suggestions, and your saved documents</p>
        </div>
        <Button onClick={async () => { 
          try {
            await studentService.refreshRecommendations(); 
            load();
          } catch (err) {
            console.error('Failed to refresh recommendations:', err);
            setError('Failed to refresh recommendations. Please try again.');
          }
        }}>Refresh AI Suggestions</Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <Card><p className="text-sm text-slate-500">Available Courses</p><h3 className="mt-2 text-3xl font-bold">{data.stats.availableCourses}</h3></Card>
        <Card><p className="text-sm text-slate-500">Completed Modules</p><h3 className="mt-2 text-3xl font-bold">{data.stats.completedModules}</h3></Card>
        <Card><p className="text-sm text-slate-500">Quiz Average</p><h3 className="mt-2 text-3xl font-bold">{data.stats.avgQuizScore}%</h3></Card>
        <Card><p className="text-sm text-slate-500">Recommendations</p><h3 className="mt-2 text-3xl font-bold">{data.stats.recommendations}</h3></Card>
        <Card><p className="text-sm text-slate-500">Flashcards</p><h3 className="mt-2 text-3xl font-bold">{data.stats.flashcards}</h3></Card>
        <Card><p className="text-sm text-slate-500">Saved Documents</p><h3 className="mt-2 text-3xl font-bold">{data.stats.documents || 0}</h3></Card>
      </div>

      {data.progress.length > 0 && (
        <div className="mt-6">
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Your Enrolled Courses</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.progress.map((item) => (
                <Link key={item._id} to={`/student/courses/${item.course?._id}`} className="group">
                  <div className="rounded-xl border p-4 transition hover:border-indigo-300 hover:shadow-md">
                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600">{item.course?.title}</h4>
                    <p className="mt-2 text-xs text-slate-500">{item.course?.category?.name}</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Progress</span>
                        <span>{item.completionPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${item.completionPercent}%` }} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.completedModules} of {item.totalModules} modules</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Personalized Suggestions</h3>
          <div className="space-y-4">
            {data.recommendations.map((rec) => (
              <div key={rec._id} className="rounded-xl border p-4">
                <div className="font-medium">{rec.title}</div>
                <div className="mt-1 text-sm text-slate-600">{rec.reason}</div>
                <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
                  {rec.suggestedActions?.map((action, idx) => <li key={idx}>{action}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Top Categories</h3>
          <div className="space-y-3">
            {Object.entries(data.topCategories).map(([name, count]) => (
              <div key={name} className="rounded-xl border p-4">
                <div className="flex justify-between font-medium"><span>{name}</span><span>{count}</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity._id} className="rounded-xl border p-4">
                <div className="font-medium">{activity.activityType}</div>
                <div className="text-sm text-slate-500">{activity.resourceType}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">In Progress Courses</h3>
          <div className="space-y-3">
            {data.progress.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="font-medium">{item.course?.title}</div>
                <div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-600" style={{ width: `${item.completionPercent}%` }} /></div>
                <div className="mt-2 text-sm text-slate-500">{item.completionPercent}% complete</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Document Center</h3>
          <p className="text-sm text-slate-600">Upload PDFs, search saved study packs, export learning data, and review attempt history.</p>
          <Link to="/student/documents" className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Open Documents Page
          </Link>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Course Uploaded Documents</h3>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="all">All Courses</option>
              {courseOptions.map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>

          {!visibleDocuments.length && <p className="text-sm text-slate-500">No uploaded course documents match this filter.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {visibleDocuments.map((item) => {
              const documentUrl = resolveAssetUrl(item.fileUrl);

              return (
                <div key={item._id} className="rounded-xl border p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">document</div>
                  <h4 className="mt-1 font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500">By {item.instructor?.firstName} {item.instructor?.lastName}</p>

                  {!!item.relatedCourses?.length && (
                    <p className="mt-2 text-xs text-slate-500">Related courses: {item.relatedCourses.join(', ')}</p>
                  )}

                  {documentUrl && (
                    <div className="mt-3 flex gap-2">
                      <a
                        className="inline-block rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        target="_blank"
                        rel="noreferrer"
                        href={documentUrl}
                      >
                        View PDF
                      </a>
                      <a
                        className="inline-block rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        href={documentUrl}
                        download={item.originalFileName || `${item.title}.pdf`}
                      >
                        Download PDF
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredDocuments.length > 8 && (
            <p className="mt-4 text-xs text-slate-500">
              Showing latest 8 matching documents. Open Courses to view full content by course.
            </p>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
}
