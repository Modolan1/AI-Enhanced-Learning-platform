import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';

export default function QuizzesPage() {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { 
    studentService.getQuizzes()
      .then((res) => { setError(null); setQuizzes(res.data); })
      .catch((err) => { console.error('Failed to load quizzes:', err); setError('Failed to load quizzes'); })
  }, []);
  const startQuiz = (quiz) => {
    setSelected(quiz);
    setAnswers(new Array(quiz.questions.length).fill(''));
    setCurrentQuestionIndex(0);
    setResult(null);
  };
  const submit = async () => {
    try {
      const response = (await studentService.submitQuiz(selected._id, answers)).data;
    const details = selected.questions.map((question, index) => ({
      index,
      questionText: question.questionText,
      options: question.options,
      selectedAnswer: answers[index],
      correctAnswer: question.correctAnswer,
      isCorrect: answers[index] === question.correctAnswer,
    }));
    setResult({ ...response, details });
    toast(`Quiz submitted! Score: ${response.score}/${response.totalQuestions}`);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    }  };

  const totalQuestions = selected?.questions?.length || 0;
  const currentQuestion = selected?.questions?.[currentQuestionIndex] || null;
  const progressPercent = totalQuestions ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0;
  const currentQuestionNumber = totalQuestions ? currentQuestionIndex + 1 : 0;

  return (
    <StudentLayout>
      {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Available Quizzes</h3>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="rounded-xl border p-4">
                <div className="font-medium">{quiz.title}</div>
                <div className="text-sm text-slate-500">{quiz.course?.title} • {quiz.questions.length} questions</div>
                <Button className="mt-3" onClick={() => startQuiz(quiz)}>Start Quiz</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          {selected ? (
            <>
              <h3 className="mb-4 text-lg font-semibold">{selected.title}</h3>

              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Question {currentQuestionNumber} of {totalQuestions}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="font-medium">{currentQuestionNumber}. {currentQuestion?.questionText || 'No questions available in this quiz.'}</div>
                <div className="mt-3 space-y-2">{currentQuestion?.options?.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name={`q-${currentQuestionIndex}`} value={opt} checked={answers[currentQuestionIndex] === opt} onChange={(e) => { const next = [...answers]; next[currentQuestionIndex] = e.target.value; setAnswers(next); }} />{opt}</label>
                ))}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" disabled={currentQuestionIndex === 0 || totalQuestions === 0} onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}>Previous</Button>
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}>Next</Button>
                ) : (
                  <Button disabled={totalQuestions === 0} onClick={submit}>Submit Quiz</Button>
                )}
              </div>

              {result && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Score: {result.score}/{result.totalQuestions} ({result.percentage}%)</div>
                  {result.details?.map((item) => (
                    <div key={`result-${item.index}`} className="rounded-xl border p-3">
                      <div className="font-medium text-slate-800">{item.index + 1}. {item.questionText}</div>
                      <div className={`mt-1 text-sm ${item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{item.isCorrect ? 'Correct' : 'Wrong'}</div>
                      <div className="mt-3 space-y-2">
                        {item.options.map((option, optionIndex) => {
                          const isCorrectAnswer = option === item.correctAnswer;
                          const isWrongSelected = option === item.selectedAnswer && !item.isCorrect;
                          const classes = isCorrectAnswer
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : isWrongSelected
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-slate-200 bg-white text-slate-700';

                          return (
                            <div key={optionIndex} className={`rounded-lg border px-3 py-2 text-sm ${classes}`}>
                              {option}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500">Select a quiz to begin.</div>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
}
