import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const createEmptyCard = () => ({ question: '', answer: '' });

const formatDifficulty = (value = 'easy') => {
  const normalized = String(value || 'easy').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const normalizeId = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

export default function ManageFlashcardsPage() {
  const toast = useToast();
  const [flashcards, setFlashcards] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [form, setForm] = useState({ course: '', category: '', difficulty: 'easy', cards: [createEmptyCard()] });

  const resetForm = (nextCourses = courses, nextCategories = categories) => {
    setEditingId(null);
    setForm({
      course: nextCourses[0]?._id || '',
      category: nextCategories[0]?._id || '',
      difficulty: 'easy',
      cards: [createEmptyCard()],
    });
  };

  const updateCard = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.map((card, cardIndex) => cardIndex === index ? { ...card, [field]: value } : card),
    }));
  };

  const addCard = () => {
    setForm((prev) => ({
      ...prev,
      cards: [...prev.cards, createEmptyCard()],
    }));
  };

  const removeCard = (index) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.length === 1 ? prev.cards : prev.cards.filter((_, cardIndex) => cardIndex !== index),
    }));
  };

  const load = async () => {
    try {
      const [flashRes, courseRes, catRes] = await Promise.all([
        adminService.getFlashcards(),
        adminService.getCourses(),
        adminService.getCategories(),
      ]);
      const nextFlashcards = Array.isArray(flashRes?.data) ? flashRes.data : [];
      const nextCourses = Array.isArray(courseRes?.data) ? courseRes.data : [];
      const nextCategories = Array.isArray(catRes?.data) ? catRes.data : [];
      setFlashcards(nextFlashcards);
      setCourses(nextCourses);
      setCategories(nextCategories);
      setForm((prev) => ({
        ...prev,
        course: prev.course || nextCourses[0]?._id || '',
        category: prev.category || nextCategories[0]?._id || '',
      }));
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to load memory cards', 'error');
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const cards = (form.cards || [])
          .map((card) => ({ question: card.question.trim(), answer: card.answer.trim() }))
          .filter((card) => card.question && card.answer);

        if (!cards.length) {
          toast('Add at least one memory card with question and answer', 'error');
          return;
        }

        const payload = {
          difficulty: form.difficulty,
          cards,
        };

        if (form.course) payload.course = form.course;
        if (form.category) payload.category = form.category;

        await adminService.updateFlashcard(editingId, payload);
        toast(cards.length > 1 ? 'Memory card updated and additional cards created successfully' : 'Memory card updated successfully');
      } else {
        if (!form.course || !form.category) {
          toast('Please select both course and category', 'error');
          return;
        }

        const cards = (form.cards || [])
          .map((card) => ({ question: card.question.trim(), answer: card.answer.trim() }))
          .filter((card) => card.question && card.answer);

        if (!cards.length) {
          toast('Add at least one memory card with question and answer', 'error');
          return;
        }

        await adminService.createFlashcard({
          course: form.course,
          category: form.category,
          difficulty: form.difficulty,
          cards,
        });
        toast(`${cards.length} memory card${cards.length === 1 ? '' : 's'} created successfully`);
      }
      resetForm();
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save memory card', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await adminService.deleteFlashcard(pendingDeleteId);
      toast('Memory card deleted successfully');
      if (editingId === pendingDeleteId) resetForm();
      setPendingDeleteId('');
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to delete memory card', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Memory Card' : 'Add Memory Card'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Course</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.course || ''} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Difficulty</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-3">
              {form.cards.map((card, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">{`Memory Card ${index + 1}`}</h4>
                    {form.cards.length > 1 && (
                      <Button type="button" variant="danger" onClick={() => removeCard(index)}>Remove</Button>
                    )}
                  </div>
                  <Input label="Question" value={card.question} onChange={(e) => updateCard(index, 'question', e.target.value)} />
                  <div className="mt-3">
                    <Input label="Answer" value={card.answer} onChange={(e) => updateCard(index, 'answer', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={addCard}>{editingId ? 'Add Another Memory Card' : 'Add Another Memory Card'}</Button>
            <Button className="w-full">{editingId ? 'Update Memory Cards' : 'Save Memory Cards'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" className="w-full mt-2" onClick={() => resetForm()}>
                Cancel Edit
              </Button>
            )}
          </form>
        </Card>
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          {flashcards.length ? flashcards.map((card) => (
            <Card key={card._id}>
              <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">{card.category?.name}</div>
              <h3 className="mt-2 font-semibold text-slate-900">{card.question}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.answer}</p>
              <div className="mt-3 text-sm text-slate-500">{card.course?.title} • {formatDifficulty(card.difficulty)}</div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => {
                  const courseId = normalizeId(card.course?._id || card.course || courses[0]?._id);
                  const categoryId = normalizeId(card.category?._id || card.category || categories[0]?._id);
                  setEditingId(card._id);
                  setForm({
                    course: courseId,
                    category: categoryId,
                    difficulty: String(card.difficulty || 'easy').toLowerCase(),
                    cards: [{ question: card.question || '', answer: card.answer || '' }],
                  });
                }}>Edit</Button>
                <Button variant="danger" onClick={() => setPendingDeleteId(card._id)}>Delete</Button>
              </div>
            </Card>
          )) : <Card><div className="text-sm text-slate-500">No memory cards created yet.</div></Card>}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete memory card"
        message="Delete this memory card permanently?"
        confirmText="Delete"
        onCancel={() => setPendingDeleteId('')}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
