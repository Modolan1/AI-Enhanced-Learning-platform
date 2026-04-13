import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function InstructorLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'instructor') {
        logout();
        setError('This login page is for instructors only.');
        return;
      }
      navigate('/instructor/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Instructor login failed');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_45%,_#e2e8f0)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">Instructor Login</h1>
        <p className="mt-2 text-center text-slate-500">Access your instructor workspace</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <Button className="w-full" type="submit">Sign In as Instructor</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">Want to join the team? <Link to="/instructor/register" className="font-medium text-indigo-600">Register as instructor</Link></p>
        <p className="mt-2 text-center text-sm text-slate-500"><Link to="/" className="text-indigo-600">Back to home</Link></p>
      </div>
    </div>
  );
}
