import { useState, useEffect } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAdmins();
      setAdmins(data.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'firstName' || name === 'lastName') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ').slice(0, 50);
    }
    if (name === 'email') {
      nextValue = value.trim().slice(0, 120);
    }
    if (name === 'password' || name === 'confirmPassword') {
      nextValue = value.slice(0, 128);
    }

    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      addToast('First name and last name are required', 'error');
      return false;
    }
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(formData.firstName.trim()) || !nameRegex.test(formData.lastName.trim())) {
      addToast('Names must contain letters and spaces only', 'error');
      return false;
    }
    if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50 || formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      addToast('First and last name must be between 2 and 50 characters', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      addToast('Email is required', 'error');
      return false;
    }
    if (!formData.password) {
      addToast('Password is required', 'error');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return false;
    }
    if (formData.password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return false;
    }
    // Check for at least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      addToast('Password must contain uppercase, lowercase, and numbers', 'error');
      return false;
    }
    return true;
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');
      await authService.createAdmin({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      addToast('Admin created successfully', 'success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setShowForm(false);
      await fetchAdmins();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    // Note: Currently, we don't have a delete admin API endpoint
    // This could be added in the future with appropriate security checks
    addToast('Admin deletion requires additional verification. Please contact system administrator.', 'error');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Admins</h1>
          <p className="text-slate-600 mt-1">Create and manage system administrators</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" /> Create Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Admin</h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  minLength={2}
                  maxLength={50}
                  pattern="^[A-Za-z ]+$"
                  title="Use letters and spaces only."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  minLength={2}
                  maxLength={50}
                  pattern="^[A-Za-z ]+$"
                  title="Use letters and spaces only."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                minLength={5}
                maxLength={120}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  minLength={8}
                  maxLength={128}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  minLength={8}
                  maxLength={128}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Password must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <p className="text-slate-600">Loading admins...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <User className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No admins yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {admins.map(admin => (
            <div key={admin._id} className="bg-white rounded-lg border border-slate-200 p-4 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-semibold text-slate-900">{admin.firstName} {admin.lastName}</h3>
                <p className="text-sm text-slate-600">{admin.email}</p>
                {admin.createdBy && (
                  <p className="text-xs text-slate-500 mt-1">
                    Created by: {admin.createdBy.firstName} {admin.createdBy.lastName}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Created: {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteAdmin(admin._id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete admin (requires verification)"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
