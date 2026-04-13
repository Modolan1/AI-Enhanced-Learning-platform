import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import InstructorLayout from '../../layouts/InstructorLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';

export default function ManageContentPage() {
  const toast = useToast();
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'document',
    category: '',
    videoUrl: '',
    tags: '',
    isPublished: true,
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const load = async () => {
    try {
      const [contentRes, categoryRes] = await Promise.all([
        instructorService.getContent(),
        instructorService.getCategories(),
      ]);
      setContent(contentRes.data);
      setCategories(categoryRes.data);
      if (!form.category && categoryRes.data[0]) {
        setForm((prev) => ({ ...prev, category: categoryRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load instructor content:', err);
      setError('Failed to load content.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const isEditing = Boolean(editingId);
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('contentType', form.contentType);
    formData.append('category', form.category);
    formData.append('videoUrl', form.videoUrl);
    formData.append('tags', form.tags);
    formData.append('isPublished', String(form.isPublished));

    if (form.contentType === 'document' && documentFile) {
      formData.append('file', documentFile);
    }

    if (form.contentType === 'video' && videoFile) {
      formData.append('videoFile', videoFile);
    }

    try {
      if (isEditing) {
        await instructorService.updateContent(editingId, formData);
        toast('Content updated successfully');
      } else {
        await instructorService.createContent(formData);
        toast('Content uploaded successfully');
      }
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        contentType: 'document',
        category: categories[0]?._id || '',
        videoUrl: '',
        tags: '',
        isPublished: true,
      });
      setDocumentFile(null);
      setVideoFile(null);
      await load();
    } catch (err) {
      console.error('Failed to create content:', err);
      const msg = err?.response?.data?.message || 'Failed to create content.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <InstructorLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Content' : 'Upload Learning Content'}</h3>
          <form className="space-y-4" onSubmit={submit}>
            <Input label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Content Type</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.contentType} onChange={(e) => setForm((prev) => ({ ...prev, contentType: e.target.value }))}>
                <option value="document">Document</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>

            {form.contentType === 'document' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Upload PDF Document</label>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
              </div>
            )}

            {form.contentType === 'video' && (
              <>
                <Input label="Video URL (optional)" value={form.videoUrl} onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Upload Video File (optional)</label>
                  <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                </div>
              </>
            )}

            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />

            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <Button className="w-full" type="submit">
              {editingId
                ? 'Update Content'
                : <><Upload className="inline-block mr-2 h-4 w-4" />Save Content</>}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" className="w-full mt-2" onClick={() => { setEditingId(null); setForm({ title: '', description: '', contentType: 'document', category: categories[0]?._id || '', videoUrl: '', tags: '', isPublished: true }); setDocumentFile(null); setVideoFile(null); }}>
                Cancel Edit
              </Button>
            )}
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {content.map((item) => (
            <Card key={item._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">{item.contentType}</div>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  <div className="mt-2 text-xs text-slate-500">Category: {item.category?.name || 'General'} • Views: {item.viewCount}</div>
                  {item.contentType === 'video' && item.videoUrl && <a className="mt-2 inline-block text-sm text-indigo-600" href={item.videoUrl} target="_blank" rel="noreferrer">Open Video</a>}
                  {item.contentType === 'document' && item.fileUrl && <a className="mt-2 inline-block text-sm text-indigo-600" href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${item.fileUrl}`} target="_blank" rel="noreferrer">Open Document</a>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { setEditingId(item._id); setForm({ title: item.title, description: item.description, contentType: item.contentType, category: item.category?._id || item.category, videoUrl: item.videoUrl || '', tags: Array.isArray(item.tags) ? item.tags.join(', ') : '', isPublished: item.isPublished }); }}>Edit</Button>
                  <Button variant="danger" onClick={async () => { try { await instructorService.deleteContent(item._id); toast('Content deleted successfully'); if (editingId === item._id) { setEditingId(null); } load(); } catch (err) { toast(err?.response?.data?.message || 'Failed to delete content', 'error'); } }}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}
