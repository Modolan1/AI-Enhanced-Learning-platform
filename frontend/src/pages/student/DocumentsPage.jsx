import { useEffect, useMemo, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';

const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TABS = ['content', 'ai-chat', 'ai-actions', 'flashcards', 'quiz'];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function tabLabel(tab) {
  if (tab === 'content') return 'Content';
  if (tab === 'ai-chat') return 'AI Chat';
  if (tab === 'ai-actions') return 'AI Actions';
  if (tab === 'flashcards') return 'Flashcards';
  return 'Quiz';
}

export default function DocumentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [maxUploadBytes, setMaxUploadBytes] = useState(DEFAULT_MAX_UPLOAD_BYTES);
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  const [chatQuestion, setChatQuestion] = useState('');
  const [isAskingChat, setIsAskingChat] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState([]);
  const [docQuizQuestionIndex, setDocQuizQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [docFlashcardIndex, setDocFlashcardIndex] = useState(0);
  const [isDocFlashcardFlipped, setIsDocFlashcardFlipped] = useState(false);

  const loadHistory = async (searchTerm = search) => {
    setIsLoadingList(true);
    try {
      const response = await studentService.getDocuments(searchTerm);
      const list = response.data || [];
      setHistory(list);

      if (!selectedId && list.length) {
        setSelectedId(list[0]._id);
      }

      if (selectedId && !list.some((item) => item._id === selectedId)) {
        setSelectedId(list[0]?._id || '');
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load document history.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadDocument = async (id) => {
    if (!id) {
      setSelectedDoc(null);
      return;
    }

    setIsLoadingDetail(true);
    try {
      const response = await studentService.getDocumentById(id);
      const doc = response.data;
      setSelectedDoc(doc);
      setQuizAnswers(new Array(doc.quiz?.questions?.length || 0).fill(''));
      setDocQuizQuestionIndex(0);
      setDocFlashcardIndex(0);
      setIsDocFlashcardFlipped(false);
      setQuizResult(null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load document details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    studentService.getDocumentUploadConfig()
      .then((res) => setMaxUploadBytes(res?.data?.maxUploadBytes || DEFAULT_MAX_UPLOAD_BYTES))
      .catch(() => setMaxUploadBytes(DEFAULT_MAX_UPLOAD_BYTES));

    loadHistory('');
  }, []);

  useEffect(() => {
    loadDocument(selectedId);
  }, [selectedId]);

  const sortedAttempts = useMemo(() => {
    const attempts = Array.isArray(selectedDoc?.attempts) ? selectedDoc.attempts : [];
    return [...attempts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [selectedDoc]);

  const handleAnalyze = async () => {
    setError('');

    if (!documentFile) {
      setError('Select a PDF document first.');
      return;
    }

    const isPdfMime = documentFile.type === 'application/pdf';
    const isPdfName = /\.pdf$/i.test(documentFile.name || '');
    if (!isPdfMime || !isPdfName) {
      setError('Only PDF files are allowed.');
      return;
    }

    if (documentFile.size > maxUploadBytes) {
      setError(`File too large. Maximum upload size is ${formatBytes(maxUploadBytes)}.`);
      return;
    }

    const formData = new FormData();
    formData.append('document', documentFile);

    try {
      setIsAnalyzing(true);
      const response = await studentService.analyzeDocument(formData);
      const created = response.data;
      setDocumentFile(null);
      await loadHistory(search);
      setSelectedId(created.id);
      setActiveTab('content');
      toast('Document uploaded and analyzed successfully');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to analyze document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDoc?._id || !chatQuestion.trim()) return;

    try {
      setIsAskingChat(true);
      await studentService.askDocumentQuestion(selectedDoc._id, chatQuestion.trim());
      setChatQuestion('');
      await loadDocument(selectedDoc._id);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to ask AI about this document.');
    } finally {
      setIsAskingChat(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedDoc?._id) return;

    try {
      const response = await studentService.submitGeneratedDocumentQuiz(selectedDoc._id, quizAnswers);
      setQuizResult(response.data);
      toast('Quiz submitted successfully');
      await loadDocument(selectedDoc._id);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to submit document quiz.');
    }
  };

  const exportJson = () => {
    if (!selectedDoc) return;
    downloadFile(`${selectedDoc.fileName.replace(/\.pdf$/i, '')}-study-pack.json`, JSON.stringify(selectedDoc, null, 2), 'application/json');
  };

  const exportAttemptsCsv = () => {
    if (!selectedDoc) return;
    const rows = [
      ['attempt', 'date', 'score', 'totalQuestions', 'percentage'],
      ...sortedAttempts.map((attempt, index) => [
        `${index + 1}`,
        new Date(attempt.createdAt).toISOString(),
        `${attempt.score}`,
        `${attempt.totalQuestions}`,
        `${attempt.percentage}`,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(`${selectedDoc.fileName.replace(/\.pdf$/i, '')}-attempt-history.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Delete this document and all its study data?')) return;
    try {
      await studentService.deleteDocument(id);
      toast('Document deleted successfully');
      if (selectedId === id) {
        setSelectedId('');
        setSelectedDoc(null);
      }
      await loadHistory(search);
    } catch (requestError) {
      const msg = requestError?.response?.data?.message || 'Unable to delete document.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const renderTabContent = () => {
    if (!selectedDoc) return null;

    const docTotalQuestions = selectedDoc.quiz?.questions?.length || 0;
    const docCurrentQuestion = selectedDoc.quiz?.questions?.[docQuizQuestionIndex] || null;
    const docProgressPercent = docTotalQuestions ? Math.round(((docQuizQuestionIndex + 1) / docTotalQuestions) * 100) : 0;
    const docCurrentQuestionNumber = docTotalQuestions ? docQuizQuestionIndex + 1 : 0;

    if (activeTab === 'content') {
      return (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-slate-500">Uploaded Document View (Extracted Text)</p>
          <div className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {selectedDoc.extractedText || 'No extracted content available for this document.'}
          </div>
        </div>
      );
    }

    if (activeTab === 'ai-chat') {
      return (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-slate-500">Ask AI for clarity about this document</p>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-auto pr-1">
            {!selectedDoc.chatHistory?.length && <p className="text-sm text-slate-500">No chat yet. Ask your first question.</p>}
            {selectedDoc.chatHistory?.map((item, idx) => (
              <div key={`${item.createdAt}-${idx}`} className="rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">You asked</p>
                <p className="mt-1 text-sm text-slate-800">{item.question}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">AI answer</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.answer}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)} • {item.source}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row">
            <input
              value={chatQuestion}
              onChange={(event) => setChatQuestion(event.target.value)}
              placeholder="Ask anything about this document..."
              minLength={2}
              maxLength={1000}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <Button onClick={handleAskQuestion} disabled={isAskingChat || !chatQuestion.trim()}>
              {isAskingChat ? 'Thinking...' : 'Ask AI'}
            </Button>
          </div>
        </div>
      );
    }

    if (activeTab === 'ai-actions') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-500">Main Concept Summary</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedDoc.summary}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-500">Simplified Detailed Explanation</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {selectedDoc.simplifiedExplanation || 'No simplified explanation generated yet.'}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-500">Important Things to Learn</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {selectedDoc.keyPoints?.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}
            </ul>
          </div>
        </div>
      );
    }

    if (activeTab === 'flashcards') {
      const flashcards = Array.isArray(selectedDoc.flashcards) ? selectedDoc.flashcards : [];
      const totalFlashcards = flashcards.length;
      const clampedIndex = Math.min(docFlashcardIndex, Math.max(0, totalFlashcards - 1));
      const currentCard = flashcards[clampedIndex];
      const flashcardProgress = totalFlashcards ? Math.round(((clampedIndex + 1) / totalFlashcards) * 100) : 0;

      return (
        <div className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">AI-Generated Flashcards</p>
            {!!totalFlashcards && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Card {clampedIndex + 1} of {totalFlashcards}
              </span>
            )}
          </div>

          {!totalFlashcards && (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No flashcards generated for this document yet.
            </div>
          )}

          {!!totalFlashcards && (
            <>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Study Progress</span>
                  <span>{flashcardProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${flashcardProgress}%` }} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDocFlashcardFlipped((prev) => !prev)}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50 to-cyan-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    {isDocFlashcardFlipped ? 'Answer' : 'Question'}
                  </span>
                  <span className="text-xs text-slate-500">Click card to {isDocFlashcardFlipped ? 'show question' : 'reveal answer'}</span>
                </div>

                <p className="text-base leading-relaxed text-slate-800 md:text-lg">
                  {isDocFlashcardFlipped ? currentCard?.answer : currentCard?.question}
                </p>
              </button>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={clampedIndex === 0}
                  onClick={() => {
                    setDocFlashcardIndex((prev) => Math.max(0, prev - 1));
                    setIsDocFlashcardFlipped(false);
                  }}
                >
                  Previous
                </Button>
                <Button variant="secondary" onClick={() => setIsDocFlashcardFlipped((prev) => !prev)}>
                  {isDocFlashcardFlipped ? 'Show Question' : 'Reveal Answer'}
                </Button>
                <Button
                  disabled={clampedIndex >= totalFlashcards - 1}
                  onClick={() => {
                    setDocFlashcardIndex((prev) => Math.min(totalFlashcards - 1, prev + 1));
                    setIsDocFlashcardFlipped(false);
                  }}
                >
                  Next
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {flashcards.map((_, index) => (
                  <button
                    key={`flashcard-jump-${index}`}
                    type="button"
                    onClick={() => {
                      setDocFlashcardIndex(index);
                      setIsDocFlashcardFlipped(false);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${index === clampedIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-slate-500">AI-Generated Quiz</p>
          <h4 className="mt-1 font-semibold text-slate-800">{selectedDoc.quiz?.title}</h4>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Question {docCurrentQuestionNumber} of {docTotalQuestions}</span>
              <span>{docProgressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${docProgressPercent}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-3">
            <p className="font-medium text-slate-800">{docCurrentQuestionNumber}. {docCurrentQuestion?.questionText || 'No questions available in this document quiz.'}</p>
            <div className="mt-2 space-y-2">
              {docCurrentQuestion?.options?.map((option, optionIndex) => (
                <label key={`${option}-${optionIndex}`} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={`doc-quiz-${docQuizQuestionIndex}`}
                    value={option}
                    checked={quizAnswers[docQuizQuestionIndex] === option}
                    onChange={(event) => {
                      const next = [...quizAnswers];
                      next[docQuizQuestionIndex] = event.target.value;
                      setQuizAnswers(next);
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={docQuizQuestionIndex === 0 || docTotalQuestions === 0} onClick={() => setDocQuizQuestionIndex((prev) => Math.max(0, prev - 1))}>Previous</Button>
            {docQuizQuestionIndex < docTotalQuestions - 1 ? (
              <Button onClick={() => setDocQuizQuestionIndex((prev) => Math.min(docTotalQuestions - 1, prev + 1))}>Next</Button>
            ) : (
              <Button disabled={docTotalQuestions === 0} onClick={handleSubmitQuiz}>Submit Quiz</Button>
            )}
          </div>

          {quizResult && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Score: {quizResult.score}/{quizResult.totalQuestions} ({quizResult.percentage}%)</div>
              {quizResult.results?.map((resultItem) => (
                <div key={`result-${resultItem.index}`} className="rounded-xl border p-3">
                  <p className="font-medium text-slate-800">{resultItem.index + 1}. {resultItem.questionText}</p>
                  <p className={`mt-1 text-sm ${resultItem.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{resultItem.isCorrect ? 'Correct' : 'Wrong'}</p>
                  <p className="mt-1 text-xs text-slate-600">Your answer: {resultItem.selectedAnswer || 'No answer selected'}</p>
                  {!resultItem.isCorrect && <p className="mt-1 text-xs font-medium text-emerald-700">Correct answer: {resultItem.correctAnswer}</p>}
                  <div className="mt-2 space-y-2">
                    {resultItem.options?.map((option, optionIndex) => {
                      const isCorrectAnswer = option === resultItem.correctAnswer;
                      const isWrongSelected = option === resultItem.selectedAnswer && !resultItem.isCorrect;
                      const classes = isCorrectAnswer
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isWrongSelected
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-white text-slate-700';

                      return <div key={`option-${optionIndex}`} className={`rounded-lg border px-3 py-2 text-sm ${classes}`}>{option}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-slate-500">Attempt History</p>
          <div className="mt-3 space-y-2">
            {!sortedAttempts.length && <p className="text-sm text-slate-500">No attempts yet.</p>}
            {sortedAttempts.map((attempt, index) => (
              <div key={`${attempt.createdAt}-${index}`} className="rounded-lg border px-3 py-2 text-sm text-slate-700">
                Attempt {index + 1} • {formatDate(attempt.createdAt)} • Score {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">Upload PDFs, view content, chat with AI for clarity, and study using AI actions, flashcards, and quizzes.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="text-lg font-semibold">Upload New Document</h3>
          <p className="mt-1 text-xs text-slate-500">PDF only. Max size: {formatBytes(maxUploadBytes)}</p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="mt-3 w-full text-sm"
            onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
          />
          <Button className="mt-3 w-full" disabled={isAnalyzing || !documentFile} onClick={handleAnalyze}>
            {isAnalyzing
              ? <><Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />Analyzing...</>
              : <><Upload className="inline-block mr-2 h-4 w-4" />Analyze & Save</>}
          </Button>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">History</h4>
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => loadHistory(search)}>Refresh</Button>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by filename or topic"
              minLength={1}
              maxLength={100}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <Button variant="secondary" className="mb-3 w-full" onClick={() => loadHistory(search)}>Search</Button>

            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {isLoadingList && <p className="text-sm text-slate-500">Loading history...</p>}
              {!isLoadingList && !history.length && <p className="text-sm text-slate-500">No saved documents yet.</p>}
              {history.map((item) => (
                <div
                  key={item._id}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item._id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <button type="button" className="w-full text-left" onClick={() => { setSelectedId(item._id); setActiveTab('content'); }}>
                    <div className="font-medium text-slate-800">{item.fileName}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</div>
                    <div className="mt-2 text-xs text-slate-600">Attempts: {item.attemptsCount} {item.latestScore != null ? `• Last score: ${item.latestScore}%` : ''}</div>
                  </button>
                  <button type="button" className="mt-2 text-xs text-rose-600 hover:underline" onClick={() => handleDeleteDocument(item._id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          {!selectedId && <p className="text-slate-500">Select a document to view details.</p>}
          {isLoadingDetail && <p className="text-slate-500">Loading document details...</p>}

          {!isLoadingDetail && selectedDoc && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedDoc.fileName}</h3>
                  <p className="text-xs text-slate-500">Saved {formatDate(selectedDoc.createdAt)} • Size: {formatBytes(selectedDoc.fileSize)} • Source: {selectedDoc.source}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={exportJson}>Export JSON</Button>
                  <Button variant="secondary" onClick={exportAttemptsCsv}>Export Attempts CSV</Button>
                </div>
              </div>

              <div className="mb-4 overflow-x-auto">
                <div className="inline-flex min-w-full gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      {tabLabel(tab)}
                    </button>
                  ))}
                </div>
              </div>

              {renderTabContent()}
            </div>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
}
