import { useEffect, useState } from 'react';
import InstructorLayout from '../../layouts/InstructorLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';
import { apiOrigin } from '../../services/apiConfig';

function getAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function ManageContentPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingModuleAssetKey, setUploadingModuleAssetKey] = useState('');
  const [persistedModuleCount, setPersistedModuleCount] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', level: 'Beginner', durationHours: 1, thumbnail: '',
    overviewNotes: '',
    announcements: [{ title: '', message: '' }],
    modules: [{ title: '', durationMinutes: 20, type: 'reading', textContent: '', videoUrl: '', resourceUrl: '', resourceTitle: '' }],
  });

  const load = async () => {
    try {
      const [courseRes, categoryRes] = await Promise.all([
        instructorService.getMyCourses(),
        instructorService.getCategories(),
      ]);
      const loadedCourses = courseRes.data || [];
      setCourses(loadedCourses);
      if (loadedCourses.length === 0) {
        setEditingId('');
        setSelectedCourseId('');
        setPersistedModuleCount(0);
      }
      setCategories(categoryRes.data || []);
      if (!form.category && categoryRes.data?.[0]) {
        setForm((prev) => ({ ...prev, category: categoryRes.data[0]._id }));
      }
      if (!editingId && !selectedCourseId && loadedCourses.length > 0) {
        startEdit(loadedCourses[0]);
      }
      return loadedCourses;
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to load instructor courses', 'error');
      return [];
    }
  };

  useEffect(() => { load(); }, []);

  const hasCourses = courses.length > 0;

  const updateModule = (index, field, value) => {
    const next = [...form.modules];
    next[index] = { ...next[index], [field]: field === 'durationMinutes' ? Number(value) : value };
    setForm({ ...form, modules: next });
  };

  const addModule = () => setForm({
    ...form,
    modules: [...form.modules, { title: '', durationMinutes: 20, type: 'reading', textContent: '', videoUrl: '', resourceUrl: '', resourceTitle: '' }],
  });

  const removeModule = (index) => {
    const next = (form.modules || []).filter((_, idx) => idx !== index);
    setForm({
      ...form,
      modules: next.length
        ? next
        : [{ title: '', durationMinutes: 20, type: 'reading', textContent: '', videoUrl: '', resourceUrl: '', resourceTitle: '' }],
    });
  };

  const confirmAndRemoveModule = (index) => {
    const module = form.modules?.[index];
    const label = module?.title?.trim() || `Lesson ${index + 1}`;
    setPendingDelete({ type: 'module', index, label });
  };

  const updateAnnouncement = (index, field, value) => {
    const next = [...form.announcements];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, announcements: next });
  };

  const addAnnouncement = () => setForm({ ...form, announcements: [...form.announcements, { title: '', message: '' }] });

  const removeAnnouncement = (index) => {
    const next = (form.announcements || []).filter((_, idx) => idx !== index);
    setForm({
      ...form,
      announcements: next.length ? next : [{ title: '', message: '' }],
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'module') {
      removeModule(pendingDelete.index);
    }
    if (pendingDelete.type === 'announcement') {
      removeAnnouncement(pendingDelete.index);
    }
    setPendingDelete(null);
  };

  const resetForm = () => {
    setEditingId('');
    setSelectedCourseId('');
    setPersistedModuleCount(0);
    setThumbnailPreview(null);
    setForm({
      title: '',
      description: '',
      category: categories[0]?._id || '',
      level: 'Beginner',
      durationHours: 1,
      thumbnail: '',
      overviewNotes: '',
      announcements: [{ title: '', message: '' }],
      modules: [{ title: '', durationMinutes: 20, type: 'reading', textContent: '', videoUrl: '', resourceUrl: '', resourceTitle: '' }],
    });
  };

  const startEdit = (course) => {
    setEditingId(course._id);
    setSelectedCourseId(course._id);
    setPersistedModuleCount(Array.isArray(course.modules) ? course.modules.length : 0);
    setThumbnailPreview(getAssetUrl(course.thumbnail) || null);
    setForm({
      title: course.title || '',
      description: course.description || '',
      category: course.category?._id || course.category || '',
      level: course.level || 'Beginner',
      durationHours: course.durationHours || 1,
      thumbnail: course.thumbnail || '',
      overviewNotes: course.overviewNotes || '',
      announcements: course.announcements?.length
        ? course.announcements.map((item) => ({ title: item.title || '', message: item.message || '' }))
        : [{ title: '', message: '' }],
      modules: course.modules?.length
        ? course.modules.map((m) => ({
          title: m.title,
          durationMinutes: m.durationMinutes,
          type: m.type,
          textContent: m.textContent || '',
          videoUrl: m.videoUrl || '',
          resourceUrl: m.resourceUrl || '',
          resourceTitle: m.resourceTitle || '',
        }))
        : [{ title: '', durationMinutes: 20, type: 'reading', textContent: '', videoUrl: '', resourceUrl: '', resourceTitle: '' }],
    });
  };

  const handleSelectCourseToManage = (courseId) => {
    setSelectedCourseId(courseId);
    const picked = courses.find((item) => item._id === courseId);
    if (picked) {
      startEdit(picked);
    }
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setThumbnailPreview(event.target.result);
    reader.readAsDataURL(file);

    try {
      setIsUploadingThumbnail(true);
      const response = await instructorService.uploadCourseThumbnail(file);
      setForm((prev) => ({ ...prev, thumbnail: response.data?.thumbnail || '' }));
      toast('Thumbnail uploaded successfully');
    } catch (err) {
      setThumbnailPreview(null);
      toast(err?.response?.data?.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleModuleAssetUpload = async (moduleIndex, assetType, file) => {
    if (!file) return;
    if (!editingId) {
      toast('Select a course and click Edit first', 'error');
      return;
    }

    // Uploaded assets are attached to modules that already exist in the database.
    // New modules must be saved first so their index is persisted server-side.
    if (moduleIndex >= persistedModuleCount) {
      toast('Save course content first, then upload files for newly added modules', 'error');
      return;
    }

    const key = `${moduleIndex}-${assetType}`;
    try {
      setUploadingModuleAssetKey(key);
      const response = await instructorService.uploadCourseModuleAsset({
        courseId: editingId,
        moduleIndex: moduleIndex + 1,
        assetType,
        resourceTitle: form.modules[moduleIndex]?.resourceTitle || '',
        file,
      });
      const url = response.data?.fileUrl || '';
      if (!url) {
        toast('Upload finished but URL is missing', 'error');
        return;
      }

      if (assetType === 'video') {
        updateModule(moduleIndex, 'videoUrl', url);
      } else {
        updateModule(moduleIndex, 'resourceUrl', url);
        if (!form.modules[moduleIndex]?.resourceTitle) {
          updateModule(moduleIndex, 'resourceTitle', response.data?.fileName || file.name || 'Module resource');
        }
      }

      toast('Module asset uploaded');
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to upload module asset', 'error');
    } finally {
      setUploadingModuleAssetKey('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!hasCourses) {
      toast('No courses assigned yet. Ask admin to assign or create a course for you first.', 'error');
      return;
    }
    if (!editingId) {
      toast('Pick a course to manage before saving content', 'error');
      return;
    }

    try {
      const sanitizedAnnouncements = (form.announcements || []).filter((item) => item.title?.trim() && item.message?.trim());
      const sanitizedModules = (form.modules || []).filter((module) => module.title?.trim());
      const payload = {
        ...form,
        durationHours: Number(form.durationHours),
        announcements: sanitizedAnnouncements,
        modules: sanitizedModules,
      };
      await instructorService.updateCourse(editingId, payload);
      toast('Course content uploaded to student dashboard successfully');
      const reloadedCourses = await load();
      setPersistedModuleCount(sanitizedModules.length);
      const updatedCourse = (reloadedCourses || []).find((course) => course._id === editingId);
      if (updatedCourse) {
        startEdit(updatedCourse);
      }
    } catch (err) {
      const details = err?.response?.data?.issues?.[0]?.message || err?.response?.data?.error;
      toast(details || err?.response?.data?.message || 'Failed to save course content', 'error');
    }
  };

  return (
    <InstructorLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 text-lg font-semibold">Manage Course Content</h3>
          <p className="mb-4 text-xs text-slate-500">Same module workflow as admin, but publishing remains admin-only.</p>

          {!hasCourses && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No courses found for your account. You can start editing content once at least one course is assigned to you.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course To Manage</label>
              <select
                className="w-full rounded-xl border border-slate-200 p-3"
                value={selectedCourseId}
                onChange={(e) => handleSelectCourseToManage(e.target.value)}
                disabled={!hasCourses}
              >
                <option value="">{hasCourses ? 'Select a course' : 'No courses available'}</option>
                {hasCourses && courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
            </div>

            <fieldset disabled={!hasCourses} className="space-y-4 disabled:opacity-60">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course Category</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course Overview Notes</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                rows={4}
                value={form.overviewNotes}
                onChange={(e) => setForm({ ...form, overviewNotes: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course Thumbnail</label>
              {thumbnailPreview && (
                <div className="mb-3 overflow-hidden rounded-xl border border-slate-200">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="h-48 w-full object-cover" />
                </div>
              )}
              <div
                className="flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 transition hover:border-indigo-400 hover:bg-indigo-50"
                onClick={() => document.getElementById('instructor-thumbnail-input').click()}
              >
                <input
                  id="instructor-thumbnail-input"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isUploadingThumbnail}
                  className="hidden"
                />
                <div className="text-center text-sm text-slate-600">{isUploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}</div>
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

            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">Course Announcements</div>
              {(form.announcements || []).map((item, idx) => (
                <div key={`announcement-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Announcement {idx + 1}</div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ type: 'announcement', index: idx })}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                  <Input label={`Announcement ${idx + 1} Title`} value={item.title} onChange={(e) => updateAnnouncement(idx, 'title', e.target.value)} />
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                    <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={item.message} onChange={(e) => updateAnnouncement(idx, 'message', e.target.value)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addAnnouncement}>Add Announcement</Button>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">Modules</div>
              {form.modules.map((module, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lesson {idx + 1}</div>
                    <button
                      type="button"
                      onClick={() => confirmAndRemoveModule(idx)}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      Delete Lesson
                    </button>
                  </div>
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
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Module Notes</label>
                    <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={module.textContent || ''} onChange={(e) => updateModule(idx, 'textContent', e.target.value)} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {module.videoUrl && (
                      <a href={getAssetUrl(module.videoUrl)} target="_blank" rel="noreferrer" className="inline-block text-xs font-medium text-indigo-600">Open uploaded video</a>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Upload Module Video</label>
                      <input type="file" accept="video/*" className="w-full rounded-xl border border-slate-200 p-2 text-sm" onChange={(e) => handleModuleAssetUpload(idx, 'video', e.target.files?.[0])} disabled={uploadingModuleAssetKey === `${idx}-video`} />
                    </div>
                    {module.resourceUrl && (
                      <a href={getAssetUrl(module.resourceUrl)} target="_blank" rel="noreferrer" className="inline-block text-xs font-medium text-indigo-600">Open uploaded resource</a>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Upload Module Resource File</label>
                      <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="w-full rounded-xl border border-slate-200 p-2 text-sm" onChange={(e) => handleModuleAssetUpload(idx, 'resource', e.target.files?.[0])} disabled={uploadingModuleAssetKey === `${idx}-resource`} />
                    </div>
                    <Input label="Resource Title" value={module.resourceTitle || ''} onChange={(e) => updateModule(idx, 'resourceTitle', e.target.value)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addModule}>Add Module</Button>
            </div>

            <Button className="w-full" disabled={!hasCourses}>Save Course Content</Button>
            {editingId && <Button type="button" variant="secondary" className="mt-2 w-full" onClick={resetForm}>Cancel Edit</Button>}
            </fieldset>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {!hasCourses && (
            <Card>
              <h4 className="text-lg font-semibold text-slate-900">No Courses Assigned Yet</h4>
              <p className="mt-2 text-sm text-slate-600">Your course list is empty. Ask an admin to assign an existing course to your account, or create a new course for you.</p>
              <Button type="button" variant="secondary" className="mt-4" onClick={load}>Refresh</Button>
            </Card>
          )}
          {courses.map((course) => (
            <Card key={course._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {course.thumbnail && (
                    <img src={getAssetUrl(course.thumbnail)} alt={course.title} className="mb-4 h-32 w-full rounded-xl object-cover" />
                  )}
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">{course.category?.name}</div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                  <div className="mt-3 text-sm text-slate-500">{course.level} • {course.durationHours} hour(s) • {course.modules?.length || 0} modules</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEdit(course)}>Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'announcement' ? 'Delete announcement' : 'Delete lesson'}
        message={pendingDelete?.type === 'announcement'
          ? 'Delete this announcement from the course content?'
          : `Delete ${pendingDelete?.label || 'this lesson'}? This action cannot be undone until you save changes.`}
        confirmText="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </InstructorLayout>
  );
}
