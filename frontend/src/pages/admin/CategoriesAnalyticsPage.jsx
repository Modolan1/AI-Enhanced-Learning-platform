import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import { adminService } from '../../services/adminService';

export default function CategoriesAnalyticsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { adminService.getCategoryAnalytics().then((res) => setItems(res.data)); }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Category Analytics</h1>
        <p className="text-sm text-slate-500">Track course coverage, flashcard density, and learner performance by category.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item._id}>
            <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Courses</div><div className="text-xl font-bold">{item.courseCount}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Quizzes</div><div className="text-xl font-bold">{item.quizCount}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Flashcards</div><div className="text-xl font-bold">{item.flashcardCount}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Avg Quiz</div><div className="text-xl font-bold">{item.avgQuizScore}%</div></div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm"><span>Avg Completion</span><span>{item.avgCompletion}%</span></div>
              <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-indigo-600" style={{ width: `${item.avgCompletion}%` }} /></div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
