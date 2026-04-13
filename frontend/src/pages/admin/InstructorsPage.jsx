import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function InstructorsPage() {
  const toast = useToast();
  const [instructors, setInstructors] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  const pendingInstructors = instructors.filter((instructor) => instructor.status === 'pending');
  const activeInstructors = instructors.filter((instructor) => instructor.status === 'active');
  const visibleInstructors = activeTab === 'pending'
    ? pendingInstructors
    : activeTab === 'active'
      ? activeInstructors
      : instructors;

  const load = () => adminService.getInstructors().then((res) => setInstructors(res.data));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (instructor) => {
    setEditingInstructor(instructor._id);
    setEditForm({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
      skillLevel: instructor.skillLevel || 'Advanced',
      preferredSubject: instructor.preferredSubject || '',
      preferredLearningStyle: instructor.preferredLearningStyle || '',
      learningGoal: instructor.learningGoal || '',
      status: instructor.status || 'active',
    });
  };

  const saveEdit = async () => {
    setError('');
    try {
      await adminService.updateInstructor(editingInstructor, editForm);
      toast('Instructor updated successfully');
      setEditingInstructor(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const updateInstructorStatus = async (instructor, status) => {
    try {
      await adminService.updateInstructor(instructor._id, {
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        skillLevel: instructor.skillLevel,
        preferredSubject: instructor.preferredSubject,
        preferredLearningStyle: instructor.preferredLearningStyle,
        learningGoal: instructor.learningGoal,
        status,
      });
      toast(status === 'active' ? 'Instructor approved' : 'Instructor application rejected');
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update instructor status.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this instructor account?')) return;
    try {
      await adminService.deleteInstructor(id);
      toast('Instructor deleted successfully');
      if (editingInstructor === id) setEditingInstructor(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <AdminLayout>
      <Card>
        <h3 className="mb-4 text-lg font-semibold">Instructors</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={activeTab === 'pending' ? 'primary' : 'secondary'} onClick={() => setActiveTab('pending')}>
            Pending Approvals ({pendingInstructors.length})
          </Button>
          <Button variant={activeTab === 'active' ? 'primary' : 'secondary'} onClick={() => setActiveTab('active')}>
            Active Instructors ({activeInstructors.length})
          </Button>
          <Button variant={activeTab === 'all' ? 'primary' : 'secondary'} onClick={() => setActiveTab('all')}>
            All ({instructors.length})
          </Button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {visibleInstructors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            {activeTab === 'pending'
              ? 'No pending instructor applications.'
              : activeTab === 'active'
                ? 'No active instructors found.'
                : 'No instructors found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleInstructors.map((instructor) => (
            <div key={instructor._id} className="rounded-xl border p-4">
              {editingInstructor === instructor._id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" value={editForm.firstName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                    <Input label="Last Name" value={editForm.lastName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                  </div>
                  <Input label="Email" value={editForm.email || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Skill Level</label>
                      <select className="w-full rounded-xl border border-slate-200 p-2 text-sm" value={editForm.skillLevel || 'Advanced'} onChange={(e) => setEditForm((prev) => ({ ...prev, skillLevel: e.target.value }))}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                      <select className="w-full rounded-xl border border-slate-200 p-2 text-sm" value={editForm.status || 'active'} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </div>
                  </div>
                  <Input label="Preferred Subject" value={editForm.preferredSubject || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, preferredSubject: e.target.value }))} />
                  <Input label="Learning Goal" value={editForm.learningGoal || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, learningGoal: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditingInstructor(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{instructor.firstName} {instructor.lastName}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${instructor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{instructor.status}</span>
                  </div>
                  <div className="text-sm text-slate-500">{instructor.email}</div>
                  <div className="mt-1 text-xs text-slate-400">{instructor.preferredSubject || 'No preferred subject'} • {instructor.skillLevel}</div>
                  {instructor.learningGoal && <div className="mt-1 text-xs text-slate-400">Goal: {instructor.learningGoal}</div>}
                  <div className="mt-3 flex gap-2">
                    {activeTab === 'pending' && instructor.status === 'pending' && (
                      <>
                        <Button onClick={() => updateInstructorStatus(instructor, 'active')}>Approve</Button>
                        <Button variant="secondary" onClick={() => updateInstructorStatus(instructor, 'inactive')}>Reject</Button>
                      </>
                    )}
                    <Button variant="secondary" onClick={() => startEdit(instructor)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(instructor._id)}>Delete</Button>
                  </div>
                </>
              )}
            </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
