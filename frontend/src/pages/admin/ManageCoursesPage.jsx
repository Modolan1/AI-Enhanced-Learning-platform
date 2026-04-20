import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '';
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  return `${apiOrigin}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
}

function getAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}

function createEmptyModule() {
  return {
    title: '',
    durationMinutes: 20,
    type: 'reading',
    textContent: '',
    videoUrl: '',
    resourceUrl: '',
    resourceTitle: '',
  };
}

function normalizeCourseModule(module = {}) {
  return {
    title: module.title || '',
    durationMinutes: Number(module.durationMinutes) || 20,
    type: module.type || 'reading',
    textContent: module.textContent || '',
    videoUrl: module.videoUrl || '',
    resourceUrl: module.resourceUrl || '',
    resourceTitle: module.resourceTitle || '',
  };
}

export default function ManageCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignmentSelections, setAssignmentSelections] = useState({});
  const [assigningCourseId, setAssigningCourseId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingModuleAssetKey, setUploadingModuleAssetKey] = useState('');
  const [moderatingReviewKey, setModeratingReviewKey] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [reportReasons, setReportReasons] = useState({});
  const [form, setForm] = useState({
    title: '', description: '', category: '', level: 'Beginner', durationHours: 1, thumbnail: '', isPublished: true,
    overviewNotes: '',
    announcements: [{ title: '', message: '' }],
    modules: [createEmptyModule()],
  });

  const load = async () => {
    const [courseRes, categoryRes, instructorRes] = await Promise.all([
      adminService.getCourses(),
      adminService.getCategories(),
      adminService.getInstructors(),
    ]);
    setCourses(courseRes.data);
    setCategories(categoryRes.data);
    const activeInstructors = (instructorRes.data || []).filter((item) => item.status === 'active');
    setInstructors(activeInstructors);

    const defaults = (courseRes.data || []).reduce((acc, course) => {
      acc[course._id] = String(course.createdBy?._id || course.createdBy || '');
      return acc;
    }, {});
    setAssignmentSelections(defaults);

    if (!form.category && categoryRes.data[0]) setForm((prev) => ({ ...prev, category: categoryRes.data[0]._id }));
  };
  useEffect(() => { load(); }, []);

  const assignInstructor = async (courseId) => {
    const instructorId = assignmentSelections[courseId];
    if (!instructorId) {
      toast('Select an instructor first', 'error');
      return;
    }

    try {
      setAssigningCourseId(courseId);
      await adminService.assignCourseInstructor(courseId, instructorId);
      toast('Course assigned to instructor successfully');
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to assign instructor', 'error');
    } finally {
      setAssigningCourseId('');
    }
  };

  const updateModule = (index, field, value) => {
    const next = [...form.modules];
    next[index] = { ...next[index], [field]: field === 'durationMinutes' ? Number(value) : value };
    setForm({ ...form, modules: next });
  };

  const addModule = () => setForm({ ...form, modules: [...form.modules, createEmptyModule()] });

  const updateAnnouncement = (index, field, value) => {
    const next = [...form.announcements];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, announcements: next });
  };

  const addAnnouncement = () => setForm({ ...form, announcements: [...form.announcements, { title: '', message: '' }] });

  const resetForm = () => {
    setEditingId(null);
    setThumbnailPreview(null);
    setForm({
      title: '',
      description: '',
      category: categories[0]?._id || '',
      level: 'Beginner',
      durationHours: 1,
      thumbnail: '',
      isPublished: true,
      overviewNotes: '',
      announcements: [{ title: '', message: '' }],
      modules: [createEmptyModule()],
    });
  };

  const startEdit = (course) => {
    setEditingId(course._id);
    setThumbnailPreview(getThumbnailUrl(course.thumbnail) || null);
    setForm({
      title: course.title,
      description: course.description,
      category: course.category?._id || course.category || categories[0]?._id || '',
      level: course.level || 'Beginner',
      durationHours: course.durationHours,
      thumbnail: course.thumbnail || '',
      isPublished: course.isPublished ?? true,
      overviewNotes: course.overviewNotes || '',
      announcements: course.announcements?.length
        ? course.announcements.map((item) => ({ title: item.title || '', message: item.message || '' }))
        : [{ title: '', message: '' }],
      modules: course.modules?.length
        ? course.modules.map((m) => normalizeCourseModule(m))
        : [createEmptyModule()],
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
      const normalizedCategory = String(form.category || '').trim();
      if (!normalizedCategory) {
        toast('Select a category before saving the course', 'error');
        return;
      }

      const sanitizedAnnouncements = (form.announcements || []).filter((item) => item.title?.trim() && item.message?.trim());
      const sanitizedModules = (form.modules || []).map((module) => normalizeCourseModule(module));
      const payload = {
        ...form,
        category: normalizedCategory,
        level: form.level || 'Beginner',
        durationHours: Number(form.durationHours),
        announcements: sanitizedAnnouncements,
        modules: sanitizedModules,
      };
      if (editingId) {
        await adminService.updateCourse(editingId, payload);
        toast('Course updated successfully');
      } else {
        await adminService.createCourse(payload);
        toast('Course created successfully');
      }
      resetForm();
      load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save course', 'error');
    }
  };

  const handleModuleAssetUpload = async (moduleIndex, assetType, file) => {
    if (!file) return;

    const key = `${moduleIndex}-${assetType}`;
    try {
      setUploadingModuleAssetKey(key);
      const response = await adminService.uploadCourseModuleAsset(file, assetType);
      const url = response.data?.fileUrl || '';

      if (!url) {
        toast('Upload completed but no file URL was returned', 'error');
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

      toast('Module asset uploaded successfully');
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to upload module asset', 'error');
    } finally {
      setUploadingModuleAssetKey('');
    }
  };

  const moderateReview = async (courseId, reviewId, action) => {
    try {
      setModeratingReviewKey(`${courseId}:${reviewId}:${action}`);
      await adminService.moderateCourseReview(courseId, reviewId, {
        action,
        reason: action === 'report' ? (reportReasons[`${courseId}:${reviewId}`] || '') : '',
      });
      toast(`Review ${action} action completed`);
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to moderate review', 'error');
    } finally {
      setModeratingReviewKey('');
    }
  };

  const removeReview = async (courseId, reviewId) => {
    try {
      setModeratingReviewKey(`${courseId}:${reviewId}:delete`);
      await adminService.deleteCourseReview(courseId, reviewId);
      toast('Review deleted');
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to delete review', 'error');
    } finally {
      setModeratingReviewKey('');
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'course') {
      await removeCourse(pendingDelete.courseId);
      setPendingDelete(null);
      return;
    }

    if (pendingDelete.type === 'review') {
      await removeReview(pendingDelete.courseId, pendingDelete.reviewId);
      setPendingDelete(null);
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
              <label className="mb-2 block text-sm font-medium text-slate-700">Course Overview Notes</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                rows={4}
                value={form.overviewNotes}
                onChange={(e) => setForm({ ...form, overviewNotes: e.target.value })}
                placeholder="Detailed notes shown on the learning page"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
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
                <select className="w-full rounded-xl border border-slate-200 p-3" value={form.level || 'Beginner'} onChange={(e) => setForm({ ...form, level: e.target.value })}>
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
              <div className="text-sm font-medium text-slate-700">Course Announcements</div>
              {(form.announcements || []).map((item, idx) => (
                <div key={`announcement-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <Input label={`Announcement ${idx + 1} Title`} value={item.title} onChange={(e) => updateAnnouncement(idx, 'title', e.target.value)} />
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                      rows={3}
                      value={item.message}
                      onChange={(e) => updateAnnouncement(idx, 'message', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addAnnouncement}>Add Announcement</Button>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">Modules</div>
              <p className="text-xs text-slate-500">Upload module video/resource files here. URLs are filled automatically before you save the course.</p>
              {form.modules.map((module, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-3">
                  <Input label={`Module ${idx + 1} Title`} value={module.title} onChange={(e) => updateModule(idx, 'title', e.target.value)} />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input label="Minutes" type="number" value={module.durationMinutes} onChange={(e) => updateModule(idx, 'durationMinutes', e.target.value)} />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                      <select className="w-full rounded-xl border border-slate-200 p-3" value={module.type || 'reading'} onChange={(e) => updateModule(idx, 'type', e.target.value)}>
                        <option value="reading">Reading</option><option value="video">Video</option><option value="exercise">Exercise</option><option value="project">Project</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Module Notes</label>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                      rows={3}
                      value={module.textContent || ''}
                      onChange={(e) => updateModule(idx, 'textContent', e.target.value)}
                      placeholder="Key points or lesson overview"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {module.videoUrl && (
                      <a
                        href={getAssetUrl(module.videoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-medium text-indigo-600"
                      >
                        Open uploaded video
                      </a>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Upload Module Video</label>
                      <input
                        type="file"
                        accept="video/*"
                        className="w-full rounded-xl border border-slate-200 p-2 text-sm"
                        onChange={(e) => handleModuleAssetUpload(idx, 'video', e.target.files?.[0])}
                        disabled={uploadingModuleAssetKey === `${idx}-video`}
                      />
                      {uploadingModuleAssetKey === `${idx}-video` && <p className="mt-1 text-xs text-slate-500">Uploading video...</p>}
                    </div>
                    {module.resourceUrl && (
                      <a
                        href={getAssetUrl(module.resourceUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-medium text-indigo-600"
                      >
                        Open uploaded resource
                      </a>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Upload Module Resource File</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        className="w-full rounded-xl border border-slate-200 p-2 text-sm"
                        onChange={(e) => handleModuleAssetUpload(idx, 'resource', e.target.files?.[0])}
                        disabled={uploadingModuleAssetKey === `${idx}-resource`}
                      />
                      {uploadingModuleAssetKey === `${idx}-resource` && <p className="mt-1 text-xs text-slate-500">Uploading resource...</p>}
                    </div>
                    <Input label="Resource Title" value={module.resourceTitle || ''} onChange={(e) => updateModule(idx, 'resourceTitle', e.target.value)} />
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

                  <div className="mt-3 rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Assigned Instructor</div>
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={assignmentSelections[course._id] || ''}
                        onChange={(e) => setAssignmentSelections((prev) => ({ ...prev, [course._id]: e.target.value }))}
                      >
                        <option value="">Select active instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor._id} value={instructor._id}>
                            {instructor.firstName} {instructor.lastName} ({instructor.email})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        onClick={() => assignInstructor(course._id)}
                        disabled={assigningCourseId === course._id || !assignmentSelections[course._id]}
                      >
                        {assigningCourseId === course._id ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 text-sm font-semibold text-slate-800">Student Reviews Moderation</div>
                    {!(course.reviews || []).length && <div className="text-xs text-slate-500">No reviews yet.</div>}
                    <div className="space-y-3">
                      {(course.reviews || []).slice(0, 5).map((review) => {
                        const reviewKey = `${course._id}:${review._id}`;
                        const statusLabel = review.isHidden ? 'hidden' : (review.moderationStatus || 'visible');
                        return (
                          <div key={review._id} className="rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium text-slate-800">
                                {review.student?.firstName || 'Student'} {review.student?.lastName || ''}
                              </div>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">{statusLabel}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Rating: {review.rating}/5</div>
                            {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              <input
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                placeholder="Report reason"
                                value={reportReasons[reviewKey] || ''}
                                onChange={(e) => setReportReasons((prev) => ({ ...prev, [reviewKey]: e.target.value }))}
                              />
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                                  onClick={() => moderateReview(course._id, review._id, 'report')}
                                  disabled={moderatingReviewKey === `${course._id}:${review._id}:report`}
                                >
                                  Report
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-800"
                                  onClick={() => moderateReview(course._id, review._id, 'hide')}
                                  disabled={moderatingReviewKey === `${course._id}:${review._id}:hide`}
                                >
                                  Hide
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
                                  onClick={() => moderateReview(course._id, review._id, 'show')}
                                  disabled={moderatingReviewKey === `${course._id}:${review._id}:show`}
                                >
                                  Show
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800"
                                  onClick={() => setPendingDelete({ type: 'review', courseId: course._id, reviewId: review._id })}
                                  disabled={moderatingReviewKey === `${course._id}:${review._id}:delete`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEdit(course)}>Edit</Button>
                  <Button variant={course.isPublished ? "secondary" : "primary"} onClick={() => togglePublish(course._id, course.isPublished)}>
                    {course.isPublished ? '📴 Unpublish' : '📱 Publish'}
                  </Button>
                  <Button variant="danger" onClick={() => setPendingDelete({ type: 'course', courseId: course._id })}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'review' ? 'Delete review' : 'Delete course'}
        message={pendingDelete?.type === 'review' ? 'Delete this review permanently?' : 'Delete this course permanently?'}
        confirmText="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}
