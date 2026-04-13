import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const UPPERCASE_RE = /[A-Z]/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

function getPasswordChecks(password) {
  return [
    { label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN },
    { label: `No more than ${PASSWORD_MAX} characters`, met: password.length > 0 && password.length <= PASSWORD_MAX },
    { label: 'At least one uppercase letter', met: UPPERCASE_RE.test(password) },
    { label: 'At least one special character (!@#$%^&*...)', met: SPECIAL_RE.test(password) },
  ];
}

export default function InstructorRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'instructor',
    skillLevel: 'Advanced',
    preferredSubject: '',
    preferredLearningStyle: 'Project-based',
    learningGoal: 'Teach students and contribute instructor content',
    weeklyLearningGoalHours: 5,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordChecks = getPasswordChecks(form.password);
  const allChecksMet = passwordChecks.every((check) => check.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordTouched(true);
    setError('');
    setSuccessMessage('');
    if (!allChecksMet) return;

    try {
      const result = await authService.registerInstructorApplication(form);
      setSuccessMessage(result?.data?.message || 'Application submitted. Wait for admin approval before login.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Instructor registration failed');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_#cffafe,_#f8fafc_45%,_#e2e8f0)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">Join Instructor Team</h1>
        <p className="mt-2 text-center text-slate-500">Create an instructor account and start publishing learning content</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Primary Subject" value={form.preferredSubject} onChange={(e) => setForm({ ...form, preferredSubject: e.target.value })} />
          <div>
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setPasswordTouched(true);
              }}
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                {passwordChecks.map((check) => (
                  <li key={check.label} className={`flex items-center gap-1.5 text-xs ${check.met ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <span>{check.met ? 'OK' : 'X'}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}
          <Button className="w-full" type="submit" disabled={passwordTouched && !allChecksMet}>Submit Instructor Application</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">Already approved? <Link to="/instructor/login" className="font-medium text-indigo-600">Login</Link></p>
        <p className="mt-2 text-center text-sm text-slate-500"><Link to="/" className="text-indigo-600">Back to home</Link></p>
      </div>
    </div>
  );
}
