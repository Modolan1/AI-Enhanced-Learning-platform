import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '';
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  return `${apiOrigin}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
}

export default function ManageCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', level: 'Beginner', durationHours: 1, thumbnail: '', isPublished: true,
    modules: [{ title: '', durationMinutes: 20, type: 'reading' }],
  });

  const load = async () => {
    const [courseRes, categoryRes] = await Promise.all([adminService.getCourses(), adminService.getCategories()]);
    setCourses(courseRes.data);
    setCategories(categoryRes.data);
    if (!form.category && categoryRes.data[0]) setForm((prev) => ({ ...prev, category: categoryRes.data[0]._id }));
  };
  useEffect(() => { load(); }, []);

  const updateModule = (index, field, value) => {
    const next = [...form.modules];
    next[index] = { ...next[index], [field]: field === 'durationMinutes' ? Number(value) : value };
    setForm({ ...form, modules: next });
  };

  const addModule = () => setForm({ ...form, modules: [...form.modules, { title: '', durationMinutes: 20, type: 'reading' }] });

  const resetForm = () => {
    setEditingId(null);
    setThumbnailPreview(null);
    setForm({ title: '', description: '', category: categories[0]?._id || '', level: 'Beginner', durationHours: 1, thumbnail: '', isPublished: true, modules: [{ title: '', durationMinutes: 20, type: 'reading' }] });
  };

  const startEdit = (course) => {
    setEditingId(course._id);
    setThumbnailPreview(getThumbnailUrl(course.thumbnail) || null);
    setForm({
      title: course.title,
      description: course.description,
      category: course.category?._id || course.category,
      level: course.level,
      durationHours: course.durationHours,
      thumbnail: course.thumbnail || '',
      isPublished: course.isPublished ?? true,
      modules: course.modules?.length ? course.modules.map((m) => ({ title: m.title, durationMinutes: m.durationMinutes, type: m.type })) : [{ title: '', durationMinutes: 20, type: 'reading' }],
    });
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => setThumbnailPreview(event.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setIsUploadingThumbnail(true);
      const response = await adminService.uploadCourseThumbnail(file);
      setForm((prev) => ({ ...prev, thumbnail: response.data?.thumbnail || '' }));
      toast('Thumbnail uploaded successfully');
    } catch (err) {
      setThumbnailPreview(null);
      toast(err?.response?.data?.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateCourse(editingId, { ...form, durationHours: Number(form.durationHours) });
        toast('Course updated successfully');
      } else {
        await adminService.createCourse({ ...form, durationHours: Number(form.durationHours) });
        toast('Course created successfully');
      }
      resetForm();
      load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save course', 'error');
    }
  };

  const removeCourse = async (id) => {
    try {
      await adminService.deleteCourse(id);
      toast('Course deleted successfully');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to delete course', 'error');
    }
  };

  const togglePublish = async (id, currentStatus) => {
    try {
      await adminService.updateCourse(id, { isPublished: !currentStatus });
      toast(!currentStatus ? 'Course published to landing page' : 'Course hidden from landing page');
      load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to update course', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Course' : 'Add Course'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course Thumbnail</label>
              {thumbnailPreview && (
                <div className="mb-3 rounded-xl overflow-hidden border border-slate-200">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-48 object-cover" />
                </div>
              )}
              <div 
                className="flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
                onClick={() => document.getElementById('thumbnail-input').click()}
              >
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isUploadingThumbnail}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="text-sm text-slate-600">
                    {isUploadingThumbnail ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </div>
                  <div className="text-xs text-slate-500">PNG, JPG, GIF, WEBP up to 5MB</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Level</label>
                <select className="w-full rounded-xl border border-slate-200 p-3" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <Input label="Duration Hours" type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              <div>
                <div className="font-medium text-slate-700">Publish to Landing Page</div>
                <div className="text-xs text-slate-500">Make this course visible to students on the landing page</div>
              </div>
            </label>
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">Modules</div>
              {form.modules.map((module, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-3">
                  <Input label={`Module ${idx + 1} Title`} value={module.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input label="Minutes" type="number" value={module.durationMinutes} onChange={(e) => updateModule(idx, 'durationMinutes', e.target.value)} />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                      <select className="w-full rounded-xl border border-slate-200 p-3" value={module.type} onChange={(e) => updateModule(idx, 'type', e.target.value)}>
                        <option value="reading">Reading</option><option value="video">Video</option><option value="exercise">Exercise</option><option value="project">Project</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addModule}>Add Module</Button>
            </div>
            <Button className="w-full">{editingId ? 'Update Course' : 'Save Course'}</Button>
            {editingId && <Button type="button" variant="secondary" className="w-full mt-2" onClick={resetForm}>Cancel Edit</Button>}
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {courses.map((course) => (
            <Card key={course._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {course.thumbnail && (
                    <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} className="mb-4 h-32 w-full rounded-xl object-cover" />
                  )}
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">{course.category?.name}</div>
                    {course.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">● Published</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">● Draft</span>
                    )}
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                  <div className="mt-3 text-sm text-slate-500">{course.level} • {course.durationHours} hour(s) • {course.modules?.length || 0} modules</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEdit(course)}>Edit</Button>
                  <Button variant={course.isPublished ? "secondary" : "primary"} onClick={() => togglePublish(course._id, course.isPublished)}>
                    {course.isPublished ? '📴 Unpublish' : '📱 Publish'}
                  </Button>
                  <Button variant="danger" onClick={() => removeCourse(course._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
