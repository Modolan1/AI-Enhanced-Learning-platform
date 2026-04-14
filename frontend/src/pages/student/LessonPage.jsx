import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

function normalizeChatReply(question, faq) {
  const normalized = (question || '').toLowerCase();
  if (!normalized.trim()) return 'Type a question to get help.';

  const hit = faq.find((item) => normalized.includes(item.question.toLowerCase().split(' ').slice(0, 3).join(' ')));
  if (hit) return hit.answer;

  return 'Try asking about study strategy, quiz preparation, or revision schedule.';
}

export default function LessonPage() {
  const { id, lessonIndex } = useParams();
  const navigate = useNavigate();
  const parsedLessonIndex = Number(lessonIndex);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentService.getLessonDetail(id, parsedLessonIndex);
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load lesson details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, parsedLessonIndex]);

  const lesson = data?.lesson;
  const faq = data?.studyHelper?.faq || [];
  const suggestedRevisionTopics = data?.studyHelper?.suggestedRevisionTopics || [];

  const completionLabel = useMemo(() => {
    if (!data?.progress) return '0%';
    return `${data.progress.completionPercent}%`;
  }, [data]);

  const submitQuestion = () => {
    const answer = normalizeChatReply(question, faq);
    setChat((prev) => [...prev, { question, answer }]);
    setQuestion('');
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      await studentService.completeLesson(id, parsedLessonIndex, true);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update lesson progress.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StudentLayout><div>Loading lesson...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">{error}</div></StudentLayout>;
  if (!lesson) return <StudentLayout><div>Lesson not found.</div></StudentLayout>;

  return (
    <StudentLayout>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{data.course.title}</p>
          <h1 className="text-2xl font-bold text-slate-900">Lesson {lesson.lessonIndex + 1}: {lesson.title}</h1>
        </div>
        <Link to={`/student/courses/${id}`}>
          <Button variant="secondary">Back to Course</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{lesson.type}</span>
              <span>{lesson.durationMinutes} min</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{lesson.textContent}</p>
          </Card>

          {lesson.videoUrl && (
            <Card>
              <h3 className="text-lg font-semibold text-slate-900">Video</h3>
              {/(youtube\.com|youtu\.be|vimeo\.com)/i.test(lesson.videoUrl) ? (
                <a className="mt-3 inline-block text-sm font-semibold text-cyan-700" href={lesson.videoUrl} target="_blank" rel="noreferrer">Open lesson video</a>
              ) : (
                <video controls className="mt-3 w-full rounded-xl border" src={lesson.videoUrl}>Your browser does not support HTML video.</video>
              )}
            </Card>
          )}

          {lesson.resource && (
            <Card>
              <h3 className="text-lg font-semibold text-slate-900">Downloadable Resource</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" href={lesson.resource.url} target="_blank" rel="noreferrer">Open Resource</a>
                <a className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" href={lesson.resource.url} download>
                  Download {lesson.resource.title}
                </a>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
            <p className="mt-2 text-sm text-slate-600">{data.progress.completedModules} of {data.progress.totalModules} lessons completed</p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-teal-600" style={{ width: completionLabel }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{completionLabel}</p>
            <Button className="mt-3 w-full" disabled={saving} onClick={handleComplete}>{saving ? 'Saving...' : 'Mark Lesson Complete'}</Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Suggested Revision Topics</h3>
            {!suggestedRevisionTopics.length && <p className="mt-2 text-sm text-slate-500">No weak topics yet. Great consistency.</p>}
            <div className="mt-2 space-y-2">
              {suggestedRevisionTopics.map((item) => (
                <div key={item.topic} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  {item.topic}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">FAQ Helper</h3>
            <div className="mt-2 space-y-2">
              {faq.map((item) => (
                <button key={item.question} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setQuestion(item.question)}>
                  {item.question}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask study FAQ..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <Button onClick={submitQuestion} disabled={!question.trim()}>Ask</Button>
            </div>

            <div className="mt-3 max-h-56 space-y-2 overflow-auto">
              {chat.map((item, index) => (
                <div key={`chat-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-700">Q: {item.question}</p>
                  <p className="mt-1 text-slate-600">A: {item.answer}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Lesson Navigation</h3>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                disabled={data.navigation.previousLessonIndex === null}
                onClick={() => navigate(`/student/courses/${id}/lessons/${data.navigation.previousLessonIndex}`)}
              >
                Previous
              </Button>
              <Button
                disabled={data.navigation.nextLessonIndex === null}
                onClick={() => navigate(`/student/courses/${id}/lessons/${data.navigation.nextLessonIndex}`)}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
