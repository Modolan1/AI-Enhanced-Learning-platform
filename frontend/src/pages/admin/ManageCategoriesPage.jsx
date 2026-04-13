import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function ManageCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const response = await adminService.getCategories();
    setCategories(response.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', description: '' });
    setError('');
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setForm({ name: category.name, description: category.description || '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminService.updateCategory(editingId, form);
        toast('Category updated successfully');
      } else {
        await adminService.createCategory(form);
        toast('Category created successfully');
      }
      resetForm();
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to save category.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminService.deleteCategory(id);
      toast('Category deleted successfully');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to delete category.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <Button className="w-full">{editingId ? 'Update Category' : 'Save Category'}</Button>
            {editingId && <Button type="button" variant="secondary" className="w-full mt-2" onClick={resetForm}>Cancel Edit</Button>}
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {categories.map((category) => (
            <Card key={category._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{category.description || 'No description'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEdit(category)}>Edit</Button>
                  <Button variant="danger" onClick={() => removeCategory(category._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
