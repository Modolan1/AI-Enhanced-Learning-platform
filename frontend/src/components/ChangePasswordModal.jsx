import { useState } from 'react';
import { X } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = value.slice(0, 128);
    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const validateForm = () => {
    if (!formData.oldPassword) {
      addToast('Current password is required', 'error');
      return false;
    }
    if (!formData.newPassword) {
      addToast('New password is required', 'error');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return false;
    }
    if (formData.oldPassword === formData.newPassword) {
      addToast('New password must be different from current password', 'error');
      return false;
    }
    if (formData.newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return false;
    }
    // Check for at least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      addToast('Password must contain uppercase, lowercase, and numbers', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');
      await authService.updatePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      addToast('Password updated successfully', 'success');
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleInputChange}
              minLength={8}
              maxLength={128}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              minLength={8}
              maxLength={128}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
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

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number.
          </p>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
