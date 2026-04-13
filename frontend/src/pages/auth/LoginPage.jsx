import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">Welcome Back</h1>
        <p className="mt-2 text-center text-slate-500">Login to your learning system</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <Button className="w-full" type="submit">Sign In</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">No account? <Link to="/register" className="font-medium text-indigo-600">Create one</Link></p>
      </div>
    </div>
  );
}
