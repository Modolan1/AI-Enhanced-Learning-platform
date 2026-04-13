import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function ManageQuizzesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', course: '', difficulty: 'Easy',
    questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }],
  });
  const load = async () => {
    const [courseRes, quizRes] = await Promise.all([adminService.getCourses(), adminService.getQuizzes()]);
    setCourses(courseRes.data); setQuizzes(quizRes.data);
  };
  useEffect(() => { load(); }, []);

  const updateQuestion = (i, field, value) => {
    const next = [...form.questions]; next[i][field] = value; setForm({ ...form, questions: next });
  };
  const updateOption = (qi, oi, value) => {
    const next = [...form.questions]; next[qi].options[oi] = value; setForm({ ...form, questions: next });
  };
  const addQuestion = () => setForm({ ...form, questions: [...form.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }] });
  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', course: '', difficulty: 'Easy', questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }] });
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setForm({
      title: quiz.title,
      course: quiz.course?._id || quiz.course,
      difficulty: quiz.difficulty,
      questions: quiz.questions.map((q) => ({ questionText: q.questionText, options: [...q.options], correctAnswer: q.correctAnswer })),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateQuiz(editingId, form);
        toast('Quiz updated successfully');
      } else {
        await adminService.createQuiz(form);
        toast('Quiz created successfully');
      }
      resetForm();
      load();
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save quiz', 'error');
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
            </div>
            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-2xl border p-4">
                <Input label={`Question ${qi + 1}`} value={q.questionText} onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {q.options.map((opt, oi) => <Input key={oi} label={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />)}
                </div>
                <div className="mt-3"><Input label="Correct Answer" value={q.correctAnswer} onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)} /></div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addQuestion}>Add Question</Button>
            <Button className="ml-3">{editingId ? 'Update Quiz' : 'Save Quiz'}</Button>
            {editingId && <Button type="button" variant="secondary" className="ml-3" onClick={resetForm}>Cancel</Button>}
          </form>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Quizzes</h3>
          <div className="space-y-3">{quizzes.map((q) => (
            <div key={q._id} className="rounded-xl border p-4">
              <div className="font-medium">{q.title}</div>
              <div className="text-sm text-slate-500">{q.course?.title} • {q.questions.length} questions</div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(q)}>Edit</Button>
                <Button variant="danger" onClick={async () => { try { await adminService.deleteQuiz(q._id); toast('Quiz deleted successfully'); if (editingId === q._id) resetForm(); load(); } catch (err) { toast(err?.response?.data?.message || 'Failed to delete quiz', 'error'); } }}>Delete</Button>
              </div>
            </div>
          ))}</div>
        </Card>
      </div>
    </AdminLayout>
  );
}
