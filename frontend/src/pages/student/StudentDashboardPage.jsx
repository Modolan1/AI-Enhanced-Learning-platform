import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

const ACTIVITY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'learning', label: 'Learning' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'profile', label: 'Profile' },
  { key: 'documents', label: 'Documents' },
];

function getBadgeClass(category) {
  if (category === 'learning') return 'bg-teal-100 text-teal-700';
  if (category === 'assessment') return 'bg-amber-100 text-amber-700';
  if (category === 'profile') return 'bg-sky-100 text-sky-700';
  if (category === 'documents') return 'bg-violet-100 text-violet-700';
  return 'bg-slate-100 text-slate-700';
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return 'just now';
  const date = new Date(dateValue);
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function mapActivity(activity) {
  const metadata = activity.metadata || {};
  const resourceId = activity.resourceId;

  switch (activity.activityType) {
    case 'course_enrollment':
      return {
        category: 'learning',
        badge: 'Learning',
        title: 'Enrolled in a course',
        detail: metadata.title || 'New course enrollment completed',
        link: resourceId ? `/student/courses/${resourceId}` : '/student/courses',
        linkLabel: 'Open course',
      };
    case 'lesson_view':
      return {
        category: 'learning',
        badge: 'Learning',
        title: 'Lesson opened',
        detail: `${metadata.courseTitle || 'Course'} • ${metadata.lessonTitle || 'Lesson'}`,
        link: resourceId != null && Number.isInteger(metadata.lessonIndex)
          ? `/student/courses/${resourceId}/lessons/${metadata.lessonIndex}`
          : '/student/courses',
        linkLabel: 'Resume lesson',
      };
    case 'lesson_complete':
      return {
        category: 'learning',
        badge: 'Learning',
        title: 'Lesson completed',
        detail: `${metadata.courseTitle || 'Course'} • ${metadata.lessonTitle || 'Lesson'}`,
        link: resourceId ? `/student/courses/${resourceId}` : '/student/courses',
        linkLabel: 'View progress',
      };
    case 'quiz_submit':
      return {
        category: 'assessment',
        badge: 'Assessment',
        title: 'Quiz submitted',
        detail: `${metadata.title || 'Quiz'} • ${metadata.percentage ?? 0}% score`,
        link: '/student/quizzes',
        linkLabel: 'Go to quizzes',
      };
    case 'flashcard_review':
      return {
        category: 'assessment',
        badge: 'Assessment',
        title: 'Memory card reviewed',
        detail: metadata.courseTitle || metadata.question || 'Memory card practice session',
        link: '/student/memory-cards',
        linkLabel: 'Continue practice',
      };
    case 'document_analyze':
      return {
        category: 'documents',
        badge: 'Documents',
        title: 'Document analyzed',
        detail: metadata.fileName || 'PDF processed for study pack',
        link: '/student/documents',
        linkLabel: 'Open documents',
      };
    case 'document_quiz_submit':
      return {
        category: 'documents',
        badge: 'Documents',
        title: 'Document quiz submitted',
        detail: `${metadata.fileName || 'Document'} • ${metadata.percentage ?? 0}% score`,
        link: '/student/documents',
        linkLabel: 'Review attempts',
      };
    case 'subscription_update':
      return {
        category: 'profile',
        badge: 'Profile',
        title: 'Subscription updated',
        detail: `${metadata.status || 'updated'} • ${metadata.plan || 'monthly'} plan`,
        link: '/student/profile',
        linkLabel: 'Manage subscription',
      };
    case 'profile_update':
      return {
        category: 'profile',
        badge: 'Profile',
        title: 'Profile updated',
        detail: 'Learning preferences and account details changed',
        link: '/student/profile',
        linkLabel: 'Open profile',
      };
    default:
      return {
        category: 'learning',
        badge: 'Learning',
        title: activity.activityType.replace(/_/g, ' '),
        detail: activity.resourceType,
        link: null,
        linkLabel: '',
      };
  }
}

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshingActivity, setRefreshingActivity] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    lessons: false,
    quizzes: false,
    flashcards: false,
    enrolledCourses: false,
    suggestions: false,
    categories: false,
    inProgressCourses: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const load = async () => {
    try {
      setError(null);
      const result = await studentService.getDashboard();
      setData(result.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard. Please try again.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      load();
    }, 45000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) return <StudentLayout><div className="text-red-600">{error}</div></StudentLayout>;
  if (!data) return <StudentLayout><div>Loading...</div></StudentLayout>;
  const mappedActivities = (data.recentActivity || []).map((activity) => ({
    raw: activity,
    item: mapActivity(activity),
  }));

  const activityCounts = mappedActivities.reduce((acc, entry) => {
    const category = entry.item.category;
    acc.all += 1;
    if (acc[category] != null) acc[category] += 1;
    return acc;
  }, { all: 0, learning: 0, assessment: 0, profile: 0, documents: 0 });

  const visibleActivities = mappedActivities.filter((entry) => activityFilter === 'all' || entry.item.category === activityFilter);
  const defaultVisibleActivityCount = 4;
  const displayedActivities = showAllActivities
    ? visibleActivities
    : visibleActivities.slice(0, defaultVisibleActivityCount);
  const hasMoreActivities = visibleActivities.length > defaultVisibleActivityCount;
  const defaultVisibleListCount = 3;
  const topCategories = Object.entries(data.topCategories || {});
  const displayedLessons = expandedSections.lessons ? (data.lessons || []) : (data.lessons || []).slice(0, defaultVisibleListCount);
  const displayedQuizzes = expandedSections.quizzes ? (data.quizzes || []) : (data.quizzes || []).slice(0, defaultVisibleListCount);
  const displayedFlashcards = expandedSections.flashcards ? (data.flashcards || []) : (data.flashcards || []).slice(0, defaultVisibleListCount);
  const displayedEnrolledCourses = expandedSections.enrolledCourses ? (data.progress || []) : (data.progress || []).slice(0, defaultVisibleListCount);
  const displayedSuggestions = expandedSections.suggestions ? (data.recommendations || []) : (data.recommendations || []).slice(0, defaultVisibleListCount);
  const displayedCategories = expandedSections.categories ? topCategories : topCategories.slice(0, defaultVisibleListCount);
  const displayedInProgressCourses = expandedSections.inProgressCourses ? (data.progress || []) : (data.progress || []).slice(0, defaultVisibleListCount);

  return (
    <StudentLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {data.student.firstName}</h1>
          <p className="text-sm text-slate-500">Track progress, memory cards, scores, AI suggestions, and your saved documents</p>
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
        <Card><p className="text-sm text-slate-500">Enrolled Courses</p><h3 className="mt-2 text-3xl font-bold">{data.stats.enrolledCourses || 0}</h3></Card>
        <Card><p className="text-sm text-slate-500">Completed Modules</p><h3 className="mt-2 text-3xl font-bold">{data.stats.completedModules}</h3></Card>
          <Card><p className="text-sm text-slate-500">Quiz Average</p><h3 className="mt-2 text-3xl font-bold">{data.stats.avgQuizScore}%</h3></Card>
          <Card><p className="text-sm text-slate-500">Attempted Quizzes</p><h3 className="mt-2 text-3xl font-bold">{data.stats.quizzes || 0}</h3></Card>
          <Card><p className="text-sm text-slate-500">Memory Card Views</p><h3 className="mt-2 text-3xl font-bold">{data.stats.flashcards || 0}</h3></Card>
        <Card><p className="text-sm text-slate-500">Saved Documents</p><h3 className="mt-2 text-3xl font-bold">{data.stats.documents || 0}</h3></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Your Lessons</h3>
          <div className="space-y-3">
            {displayedLessons.map((lesson) => (
              <Link key={`${lesson.courseId}-${lesson.lessonIndex}`} to={`/student/courses/${lesson.courseId}/lessons/${lesson.lessonIndex}`} className="block rounded-xl border p-3 hover:border-indigo-300">
                <div className="text-sm font-medium text-slate-900">{lesson.courseTitle}</div>
                <div className="text-sm text-slate-600">Lesson {lesson.lessonIndex + 1}: {lesson.title}</div>
              </Link>
            ))}
            {!data.lessons?.length && <div className="text-sm text-slate-500">Enroll in a course to get lessons.</div>}
          </div>
          {data.lessons?.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('lessons')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.lessons ? 'See less' : 'See more'}
            </button>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Quizzes</h3>
            <Link to="/student/quizzes" className="text-xs font-semibold text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {displayedQuizzes.map((quiz) => (
              <Link key={quiz._id} to="/student/quizzes" className="block rounded-xl border p-3 transition hover:border-indigo-300 hover:bg-indigo-50">
                <div className="text-sm font-medium text-slate-900">{quiz.title}</div>
                <div className="text-xs text-slate-500">{quiz.course?.title}</div>
              </Link>
            ))}
            {!data.quizzes?.length && <div className="text-sm text-slate-500">No quizzes for enrolled courses yet.</div>}
          </div>
          {data.quizzes?.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('quizzes')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.quizzes ? 'See less' : 'See more'}
            </button>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Memory Cards</h3>
            <Link to="/student/memory-cards" className="text-xs font-semibold text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {displayedFlashcards.map((card) => (
              <Link key={card._id} to="/student/memory-cards" className="block rounded-xl border p-3 transition hover:border-indigo-300 hover:bg-indigo-50">
                <div className="text-sm font-medium text-slate-900">{card.question}</div>
                <div className="text-xs text-slate-500">{card.course?.title}</div>
              </Link>
            ))}
            {!data.flashcards?.length && <div className="text-sm text-slate-500">No memory cards for enrolled courses yet.</div>}
          </div>
          {data.flashcards?.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('flashcards')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.flashcards ? 'See less' : 'See more'}
            </button>
          )}
        </Card>
      </div>

      {data.progress.length > 0 && (
        <div className="mt-6">
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Your Enrolled Courses</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedEnrolledCourses.map((item) => (
                <Link key={item._id} to={`/student/courses/${item.course?._id}/learn`} className="group">
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
            {data.progress.length > defaultVisibleListCount && (
              <button type="button" onClick={() => toggleSection('enrolledCourses')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
                {expandedSections.enrolledCourses ? 'See less' : 'See more'}
              </button>
            )}
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Personalized Suggestions</h3>
          <div className="space-y-4">
            {displayedSuggestions.map((rec) => (
              <div key={rec._id} className="rounded-xl border p-4">
                <div className="font-medium">{rec.title}</div>
                <div className="mt-1 text-sm text-slate-600">{rec.reason}</div>
                <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
                  {rec.suggestedActions?.map((action, idx) => <li key={idx}>{action}</li>)}
                </ul>
              </div>
            ))}
          </div>
          {data.recommendations.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('suggestions')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.suggestions ? 'See less' : 'See more'}
            </button>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Top Categories</h3>
          <div className="space-y-3">
            {displayedCategories.map(([name, count]) => (
              <div key={name} className="rounded-xl border p-4">
                <div className="flex justify-between font-medium"><span>{name}</span><span>{count}</span></div>
              </div>
            ))}
          </div>
          {topCategories.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('categories')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.categories ? 'See less' : 'See more'}
            </button>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              disabled={refreshingActivity}
              onClick={async () => {
                try {
                  setRefreshingActivity(true);
                  await load();
                } finally {
                  setRefreshingActivity(false);
                }
              }}
            >
              {refreshingActivity ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {ACTIVITY_FILTERS.map((tab) => {
              const isActive = activityFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivityFilter(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {tab.label} ({activityCounts[tab.key] || 0})
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {!visibleActivities.length && <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No activity in this category yet.</div>}
            {displayedActivities.map(({ raw: activity, item }) => {
              return (
                <div key={activity._id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeClass(item.category)}`}>
                        {item.badge}
                      </span>
                      <div className="text-sm font-medium text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-600">{item.detail}</div>
                    </div>
                    <div className="text-[11px] text-slate-500">{formatRelativeTime(activity.createdAt)}</div>
                  </div>
                  {item.link && (
                    <Link to={item.link} className="mt-1 inline-block text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                      {item.linkLabel}
                    </Link>
                  )}
                </div>
              );
            })}
            {hasMoreActivities && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowAllActivities((prev) => !prev)}
              >
                {showAllActivities ? 'See less' : `See more (${visibleActivities.length - defaultVisibleActivityCount})`}
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">In Progress Courses</h3>
          <div className="space-y-3">
            {displayedInProgressCourses.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="font-medium">{item.course?.title}</div>
                <div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-600" style={{ width: `${item.completionPercent}%` }} /></div>
                <div className="mt-2 text-sm text-slate-500">{item.completionPercent}% complete</div>
              </div>
            ))}
          </div>
          {data.progress.length > defaultVisibleListCount && (
            <button type="button" onClick={() => toggleSection('inProgressCourses')} className="mt-4 w-full rounded-xl border border-dashed px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50">
              {expandedSections.inProgressCourses ? 'See less' : 'See more'}
            </button>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Document Center</h3>
          <p className="text-sm text-slate-600">Upload PDFs, search saved study packs, export learning data, and review attempt history.</p>
          <Link to="/student/documents" className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Open Documents Page
          </Link>
        </Card>
      </div>

    </StudentLayout>
  );
}
