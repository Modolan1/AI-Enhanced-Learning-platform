import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function ManageQuizzesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [form, setForm] = useState({
    title: '', course: '', difficulty: 'easy',
    questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }],
  });
  const toCorrectAnswerIndex = (question) => {
    const rawValue = question?.correctAnswer;
    const options = Array.isArray(question?.options) ? question.options : [];
    const parsed = Number.parseInt(rawValue, 10);

    if (Number.isFinite(parsed) && parsed >= 0) {
      if (!options.length) return parsed;
      return Math.min(parsed, options.length - 1);
    }

    if (typeof rawValue === 'string') {
      const optionIndex = options.findIndex((option) => String(option || '').trim() === rawValue.trim());
      if (optionIndex >= 0) return optionIndex;
    }

    return 0;
  };

  const load = async () => {
    try {
      const [courseRes, quizRes] = await Promise.all([adminService.getCourses(), adminService.getQuizzes()]);
      setCourses(Array.isArray(courseRes?.data) ? courseRes.data : []);
      setQuizzes(Array.isArray(quizRes?.data) ? quizRes.data : []);
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to load quizzes', 'error');
      setQuizzes([]);
    }
  };
  useEffect(() => { load(); }, []);

  const updateQuestion = (i, field, value) => {
    const next = [...form.questions]; next[i][field] = value; setForm({ ...form, questions: next });
  };
  const updateOption = (qi, oi, value) => {
    const next = [...form.questions]; next[qi].options[oi] = value; setForm({ ...form, questions: next });
  };
  const addQuestion = () => setForm({ ...form, questions: [...form.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }] });
  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', course: '', difficulty: 'easy', questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }] });
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setForm({
      title: quiz.title,
      course: quiz.course?._id || quiz.course,
      difficulty: String(quiz.difficulty || 'easy').toLowerCase(),
      questions: (quiz.questions || []).map((q) => ({
        questionText: q.questionText,
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correctAnswer: toCorrectAnswerIndex(q),
      })),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        difficulty: String(form.difficulty || 'easy').toLowerCase(),
        questions: (form.questions || []).map((question) => ({
          ...question,
          correctAnswer: Number.parseInt(question.correctAnswer, 10),
        })),
      };

      if (editingId) {
        await adminService.updateQuiz(editingId, payload);
        toast('Quiz updated successfully');
      } else {
        await adminService.createQuiz(payload);
        toast('Quiz created successfully');
      }
      resetForm();
      await load();
    } catch (err) {
      const fieldMessage = err?.response?.data?.errors?.[0]?.message;
      toast(fieldMessage || err?.response?.data?.message || 'Failed to save quiz', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await adminService.deleteQuiz(pendingDeleteId);
      toast('Quiz deleted successfully');
      if (editingId === pendingDeleteId) resetForm();
      setPendingDeleteId('');
      await load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to delete quiz', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Quiz' : 'Create Quiz'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Quiz Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Course</label><select className="w-full rounded-xl border border-slate-200 px-4 py-3" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}><option value="">Select course</option>{courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}</select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Difficulty</label><select className="w-full rounded-xl border border-slate-200 px-4 py-3" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            </div>
            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-2xl border p-4">
                <Input label={`Question ${qi + 1}`} value={q.questionText} onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {q.options.map((opt, oi) => <Input key={oi} label={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />)}
                </div>
                <div className="mt-3"><Input label="Correct Answer Index (0-3)" type="number" value={q.correctAnswer} onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)} /></div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addQuestion}>Add Question</Button>
            <Button className="ml-3">{editingId ? 'Update Quiz' : 'Save Quiz'}</Button>
            {editingId && <Button type="button" variant="secondary" className="ml-3" onClick={resetForm}>Cancel</Button>}
          </form>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Quizzes</h3>
          <div className="space-y-3">{quizzes.length ? quizzes.map((q) => (
            <div key={q._id} className="rounded-xl border p-4">
              <div className="font-medium">{q.title}</div>
              <div className="text-sm text-slate-500">{q.course?.title || 'No course'} • {Array.isArray(q.questions) ? q.questions.length : 0} questions</div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(q)}>Edit</Button>
                <Button variant="danger" onClick={() => setPendingDeleteId(q._id)}>Delete</Button>
              </div>
            </div>
          )) : <div className="text-sm text-slate-500">No quizzes found yet.</div>}</div>
        </Card>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete quiz"
        message="Delete this quiz permanently?"
        confirmText="Delete"
        onCancel={() => setPendingDeleteId('')}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
