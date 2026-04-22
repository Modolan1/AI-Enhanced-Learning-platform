import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getRegistrationErrorDetails } from './registrationErrorMessage';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const UPPERCASE_RE = /[A-Z]/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

function getPasswordChecks(password) {
  return [
    { label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN },
    { label: `No more than ${PASSWORD_MAX} characters`, met: password.length > 0 && password.length <= PASSWORD_MAX },
    { label: 'At least one uppercase letter', met: UPPERCASE_RE.test(password) },
    { label: 'At least one special character (!@#$%^&*…)', met: SPECIAL_RE.test(password) },
  ];
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'student',
    learningGoal: '', skillLevel: 'Beginner', preferredSubject: '', preferredLearningStyle: '', weeklyLearningGoalHours: 5,
  });
  const [error, setError] = useState(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordChecks = getPasswordChecks(form.password);
  const allChecksMet = passwordChecks.every((check) => check.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordTouched(true);
    setError(null);
    if (!allChecksMet) return;
    try {
      const result = await register(form);
      const user = result?.user;
      if (!user) {
        setError({
          title: 'Registration submitted',
          message: result?.message || 'Registration completed. Please wait for approval.',
        });
        return;
      }
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(getRegistrationErrorDetails(err));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">Create Account</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div>
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setPasswordTouched(true); }}
              />
              {passwordTouched && (
                <ul className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <li key={check.label} className={`flex items-center gap-1.5 text-xs ${check.met ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <span>{check.met ? '✓' : '✗'}</span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Preferred Subject" value={form.preferredSubject} onChange={(e) => setForm({ ...form, preferredSubject: e.target.value })} />
            <Input label="Learning Style" value={form.preferredLearningStyle} onChange={(e) => setForm({ ...form, preferredLearningStyle: e.target.value })} />
          </div>
          <Input label="Learning Goal" value={form.learningGoal} onChange={(e) => setForm({ ...form, learningGoal: e.target.value })} />
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">{error.title}</p>
              <p className="mt-1">{error.message}</p>
            </div>
          )}
          <Button className="w-full" type="submit" disabled={passwordTouched && !allChecksMet}>Create Account</Button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or sign up with</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        {googleLoading ? (
          <div className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-500">Signing in with Google…</div>
        ) : (
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setGoogleLoading(true);
              setError(null);
              try {
                const user = await loginWithGoogle(credentialResponse.credential);
                navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
              } catch (err) {
                setError(getRegistrationErrorDetails(err, 'Google sign-up failed'));
              } finally {
                setGoogleLoading(false);
              }
            }}
            onError={() => setError({
              title: 'Google sign-up failed',
              message: 'We could not complete Google sign-up right now. Please try again or register with email and password.',
            })}
            width="100%"
            text="signup_with"
            shape="rectangular"
            logo_alignment="left"
          />
        )}
        <p className="mt-4 text-center text-sm text-slate-600">Already registered? <Link to="/" className="font-medium text-indigo-600">Sign in</Link></p>
      </div>
    </div>
  );
}
