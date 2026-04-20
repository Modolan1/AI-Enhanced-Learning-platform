import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import { adminService } from '../../services/adminService';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => { adminService.getDashboard().then((res) => setData(res.data)); }, []);
  if (!data) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <Card><p className="text-sm text-slate-500">Students</p><h3 className="mt-2 text-3xl font-bold">{data.stats.students}</h3></Card>
        <Card><p className="text-sm text-slate-500">Courses</p><h3 className="mt-2 text-3xl font-bold">{data.stats.courses}</h3></Card>
        <Card><p className="text-sm text-slate-500">Quizzes</p><h3 className="mt-2 text-3xl font-bold">{data.stats.quizzes}</h3></Card>
        <Card><p className="text-sm text-slate-500">Memory Cards</p><h3 className="mt-2 text-3xl font-bold">{data.stats.flashcards}</h3></Card>
        <Card><p className="text-sm text-slate-500">Categories</p><h3 className="mt-2 text-3xl font-bold">{data.stats.categories}</h3></Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent Quizzes</h3>
          <div className="space-y-3">
            {(data.recentQuizzes || []).length ? (data.recentQuizzes || []).map((quiz) => (
              <div key={quiz._id} className="rounded-xl border p-4">
                <div className="font-medium">{quiz.title}</div>
                <div className="text-sm text-slate-500">{quiz.course?.title || 'No course'} • {(quiz.questions || []).length} questions</div>
              </div>
            )) : <div className="text-sm text-slate-500">No quizzes yet.</div>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent Quiz Attempts</h3>
          <div className="space-y-3">
            {(data.recentAttempts || []).length ? data.recentAttempts.map((attempt) => (
              <div key={attempt._id} className="rounded-xl border p-4">
                <div className="font-medium">{attempt.student?.firstName} {attempt.student?.lastName}</div>
                <div className="text-sm text-slate-500">{attempt.quiz?.title} • {attempt.percentage}%</div>
              </div>
            )) : <div className="text-sm text-slate-500">No attempts yet.</div>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent Progress</h3>
          <div className="space-y-3">
            {(data.progress || []).length ? data.progress.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="font-medium">{item.student?.firstName} {item.student?.lastName}</div>
                <div className="text-sm text-slate-500">{item.course?.title} • {item.completionPercent}% complete</div>
              </div>
            )) : <div className="text-sm text-slate-500">No progress yet.</div>}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
