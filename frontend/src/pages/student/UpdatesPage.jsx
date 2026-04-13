import { useEffect, useMemo, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import {
  formatUpdateTime,
  getLastSeenTimestamp,
  getStudentUpdates,
  setLastSeenNow,
} from '../../services/studentUpdatesService';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getStudentUpdates();
        setUpdates(data);
        setLastSeenNow();
      } catch (requestError) {
        console.error('Failed to load updates:', requestError);
        setError('Failed to load updates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const lastSeen = useMemo(() => getLastSeenTimestamp(), []);

  const visibleUpdates = useMemo(() => {
    const base = filter === 'all'
      ? updates
      : updates.filter((item) => item.source.toLowerCase() === filter);

    return base.map((item) => ({
      ...item,
      isNew: item.timestamp > lastSeen,
    }));
  }, [updates, filter, lastSeen]);

  return (
    <StudentLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Updates</h1>
          <p className="text-sm text-slate-500">Track latest content and course changes from instructors and admins.</p>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All sources</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card>
        {loading && <p className="text-sm text-slate-500">Loading updates...</p>}
        {!loading && error && <p className="text-sm text-rose-600">{error}</p>}

        {!loading && !error && !visibleUpdates.length && (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No updates available for this filter.</p>
        )}

        {!loading && !error && !!visibleUpdates.length && (
          <div className="space-y-3">
            {visibleUpdates.map((item) => (
              <div key={item.id} className={`rounded-xl border px-4 py-3 ${item.isNew ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.source === 'Instructor' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {item.source}
                    </span>
                    {item.isNew && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">New</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{formatUpdateTime(item.rawDate)}</p>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </StudentLayout>
  );
}
