import { useEffect, useState } from 'react';
import InstructorLayout from '../../layouts/InstructorLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';

export default function InstructorProfilePage() {
  const addToast = useToast();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    instructorService.getProfile()
      .then((res) => { setError(''); setForm(res.data); })
      .catch((err) => {
        console.error('Failed to load instructor profile:', err);
        setError('Failed to load profile');
      });
  }, []);

  if (error) return <InstructorLayout><div className="text-rose-600">{error}</div></InstructorLayout>;
  if (!form) return <InstructorLayout><div>Loading...</div></InstructorLayout>;

  const save = async () => {
    try {
      const updated = await instructorService.updateProfile(form);
      setForm(updated.data);
      setMessage('Profile updated successfully');
      addToast('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update instructor profile:', err);
      const msg = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(msg);
      addToast(msg, 'error');
    }
  };

  return (
    <InstructorLayout>
      <Card className="max-w-3xl">
        <h3 className="mb-4 text-lg font-semibold">Instructor Profile</h3>
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="First Name" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Preferred Subject" value={form.preferredSubject || ''} onChange={(e) => setForm({ ...form, preferredSubject: e.target.value })} />
          <Input label="Skill Level" value={form.skillLevel || ''} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })} />
          <Input label="Learning Style" value={form.preferredLearningStyle || ''} onChange={(e) => setForm({ ...form, preferredLearningStyle: e.target.value })} />
          <Input label="Weekly Goal Hours" type="number" value={form.weeklyLearningGoalHours || 0} onChange={(e) => setForm({ ...form, weeklyLearningGoalHours: Number(e.target.value) })} />
        </div>
        <div className="mt-4"><Input label="Learning Goal" value={form.learningGoal || ''} onChange={(e) => setForm({ ...form, learningGoal: e.target.value })} /></div>
        {message && <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}
        <div className="mt-4 flex gap-3">
          <Button onClick={save}>Save Changes</Button>
          <Button onClick={() => setIsPasswordModalOpen(true)} className="bg-slate-600 hover:bg-slate-700">
            Change Password
          </Button>
        </div>
      </Card>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </InstructorLayout>
  );
}
