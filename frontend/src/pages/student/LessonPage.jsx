import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

function StudyTip({ tip }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-800">
      {tip}
    </div>
  );
}

const STUDY_TIPS_BY_TYPE = {
  video: [
    'Watch in short focused segments and pause to summarize each part in your own words.',
    'Write down three key points before moving to the next lesson.',
    'Replay difficult parts and connect them to quiz questions you missed before.',
  ],
  resource: [
    'Skim headings first, then read each section with intent.',
    'Highlight terms you do not fully understand and review them after reading.',
    'Close the file and explain the lesson from memory in 3-5 bullet points.',
  ],
  default: [
    'Read once for context, then again for retention.',
    'Turn each paragraph into a one-line summary in your notes.',
    'Use active recall by answering your own questions after each section.',
  ],
};

const SMART_QA_PAIRS = [
  {
    q: 'how should i study this lesson',
    a: 'Use a focus loop: study for 20 minutes, summarize in 3 bullets, then test yourself quickly.',
  },
  {
    q: 'what do i do if i fail a quiz',
    a: 'Review missed questions first, revisit the related topic, then retake the quiz with a slower pace.',
  },
  {
    q: 'how often should i revise',
    a: 'Review within 24 hours, then around day 3 and day 7. Short repeat sessions improve retention.',
  },
  {
    q: 'how do i take good notes',
    a: 'Write in your own words, keep points short, and include at least one question for each topic.',
  },
  {
    q: 'tips for memory',
    a: 'Use active recall and spaced repetition. Test yourself before rereading.',
  },
];

function getStudyTips(lessonType = '', hasRevisionTopics = false) {
  const base = STUDY_TIPS_BY_TYPE[lessonType.toLowerCase()] || STUDY_TIPS_BY_TYPE.default;
  const tips = [...base];
  if (hasRevisionTopics) {
    tips.push('You have flagged revision topics. Review those immediately after this lesson session.');
  }
  return tips.slice(0, 4);
}

function smartAnswer(question, faq = []) {
  const normalized = (question || '').toLowerCase().trim();
  if (!normalized) return null;

  const faqHit = faq.find((item) =>
    normalized.includes((item.question || '').toLowerCase().split(' ').slice(0, 4).join(' ')),
  );
  if (faqHit) return faqHit.answer;

  const quickHit = SMART_QA_PAIRS.find((pair) =>
    pair.q.split(' ').filter((w) => w.length > 3).some((w) => normalized.includes(w)),
  );

  return quickHit
    ? quickHit.a
    : 'Ask about study strategy, revision, quiz recovery, note-taking, or memory techniques.';
}

export default function LessonPage() {
  const { id, lessonIndex } = useParams();
  const navigate = useNavigate();
  const parsedIndex = Number(lessonIndex);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentService.getLessonDetail(id, parsedIndex);
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, parsedIndex]);

  const lesson = data?.lesson;
  const faq = data?.studyHelper?.faq || [];
  const revisionTopics = data?.studyHelper?.suggestedRevisionTopics || [];

  const studyTips = useMemo(
    () => getStudyTips(lesson?.type || '', revisionTopics.length > 0),
    [lesson, revisionTopics],
  );

  const askQuestion = () => {
    const q = question.trim();
    if (!q || thinking) return;

    setThinking(true);
    setQuestion('');

    const answer = smartAnswer(q, faq);
    setTimeout(() => {
      setChat((prev) => [...prev, { q, a: answer }]);
      setThinking(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }, 450);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">Loading focused lesson view...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700">
          <p className="font-semibold">Unable to load focus lesson view</p>
          <p className="mt-1 text-sm">{error}</p>
          <Link to="/student/dashboard" className="mt-3 inline-block text-sm font-semibold underline">
            Back to dashboard
          </Link>
        </div>
      </StudentLayout>
    );
  }

  if (!lesson) {
    return (
      <StudentLayout>
        <div>Lesson not found.</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        <Link to="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <span>/</span>
        <Link to={`/student/courses/${id}`} className="hover:text-indigo-600">{data.course?.title}</Link>
        <span>/</span>
        <span className="text-slate-600">Focus Lesson {parsedIndex + 1}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Focus Lesson View</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lesson {parsedIndex + 1}: {lesson.title}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/student/courses/${id}`)}>
            Back to Course
          </Button>
          {data?.navigation?.nextLessonIndex !== null && (
            <Button onClick={() => navigate(`/student/courses/${id}/lessons/${data.navigation.nextLessonIndex}`)}>
              Next Lesson
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">AI Study Tips</h2>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">Focus mode</span>
            </div>
            <p className="mb-3 text-sm text-slate-500">
              Personalized tips for this lesson based on its type and your revision history.
            </p>
            <div className="space-y-2.5">
              {studyTips.map((tip, idx) => (
                <StudyTip key={`${tip}-${idx}`} tip={tip} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">AI Study Assistant</h2>
              <span className="text-xs text-slate-400">Ask and get instant guidance</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                'How should I study this?',
                'How often should I revise?',
                'What if I fail a quiz?',
                'Tips for memory?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
              {chat.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">
                  Ask anything about learning this lesson faster and better.
                </p>
              )}
              {chat.map((entry, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="rounded-xl rounded-br-none bg-indigo-600 px-3 py-2 text-xs text-white">
                    {entry.q}
                  </div>
                  <div className="rounded-xl rounded-tl-none border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {entry.a}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 animate-pulse">
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                placeholder="Ask a study question..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={!question.trim() || thinking}
                onClick={askQuestion}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
              >
                Ask
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-slate-900">Document Menu</h3>
            <p className="mb-3 text-sm text-slate-500">
              Continue your learning workflow with document tools directly from this page.
            </p>

            <div className="space-y-2 text-sm text-slate-700">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Document Content Review</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">AI Chat on Uploaded Documents</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">AI Actions and Study Pack Tools</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Document Memory Cards and Quiz</div>
            </div>

            <Link
              to="/student/documents"
              className="mt-4 inline-block w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Open Document Menu
            </Link>
          </div>

          {faq.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold text-slate-900">Recommended Questions</h3>
              <div className="space-y-2">
                {faq.slice(0, 5).map((item, idx) => (
                  <button
                    key={`${item.question}-${idx}`}
                    type="button"
                    onClick={() => setQuestion(item.question)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
