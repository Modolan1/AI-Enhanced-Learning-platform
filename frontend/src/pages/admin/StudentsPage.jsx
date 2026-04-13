import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function StudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  const load = () => adminService.getStudents().then((res) => setStudents(res.data));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (student) => {
    setEditingStudent(student._id);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      skillLevel: student.skillLevel || 'Beginner',
      preferredSubject: student.preferredSubject || '',
      preferredLearningStyle: student.preferredLearningStyle || '',
      learningGoal: student.learningGoal || '',
    });
  };

  const saveEdit = async () => {
    setError('');
    try {
      await adminService.updateStudent(editingStudent, editForm);
      toast('Student updated successfully');
      setEditingStudent(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this student account?')) return;
    try {
      await adminService.deleteStudent(id);
      toast('Student deleted successfully');
      if (editingStudent === id) setEditingStudent(null);
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
        <h3 className="mb-4 text-lg font-semibold">Students</h3>
        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student._id} className="rounded-xl border p-4">
              {editingStudent === student._id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" value={editForm.firstName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                    <Input label="Last Name" value={editForm.lastName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                  </div>
                  <Input label="Email" value={editForm.email || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Skill Level</label>
                      <select className="w-full rounded-xl border border-slate-200 p-2 text-sm" value={editForm.skillLevel || 'Beginner'} onChange={(e) => setEditForm((prev) => ({ ...prev, skillLevel: e.target.value }))}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                    <Input label="Preferred Subject" value={editForm.preferredSubject || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, preferredSubject: e.target.value }))} />
                  </div>
                  <Input label="Learning Goal" value={editForm.learningGoal || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, learningGoal: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditingStudent(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                  <div className="text-sm text-slate-500">{student.email}</div>
                  <div className="mt-1 text-xs text-slate-400">{student.preferredSubject || 'No preferred subject'} • {student.skillLevel}</div>
                  {student.learningGoal && <div className="mt-1 text-xs text-slate-400">Goal: {student.learningGoal}</div>}
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => startEdit(student)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(student._id)}>Delete</Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
