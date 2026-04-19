import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        {googleLoading ? (
          <div className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-500">Signing in with Google…</div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            width="100%"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
          />
        )}
        <p className="mt-4 text-center text-sm text-slate-600">No account? <Link to="/register" className="font-medium text-indigo-600">Create one</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Exchange access_token for an id_token via userinfo, but @react-oauth/google
        // with flow='auth-code' gives a code. Use implicit flow and fetch userinfo to
        // get the id_token from Google's tokeninfo endpoint.
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        const profile = await res.json();
        // We need an id_token — use the credential flow instead (see GoogleLogin below)
      } catch (err) {
        setError('Google sign-in failed');
      } finally {
        setGoogleLoading(false);
      }
    },
  });

  const handleGoogleCredential = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleSignInButton onCredential={handleGoogleCredential} loading={googleLoading} />
        <p className="mt-4 text-center text-sm text-slate-600">No account? <Link to="/register" className="font-medium text-indigo-600">Create one</Link></p>
      </div>
    </div>
  );
}

import { GoogleLogin } from '@react-oauth/google';
function GoogleSignInButton({ onCredential, loading }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {loading ? (
        <div className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-500">Signing in…</div>
      ) : (
        <GoogleLogin
          onSuccess={onCredential}
          onError={() => {}}
          width="100%"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
        />
      )}
    </div>
  );
}
