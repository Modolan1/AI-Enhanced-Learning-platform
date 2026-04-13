import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

export default function FlashcardsPage() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    studentService.getFlashcards()
      .then((res) => { setError(''); setCards(res.data); })
      .catch((err) => { console.error('Failed to load flashcards:', err); setError('Failed to load flashcards'); });
  }, []);
  const current = cards[index];

  const next = async () => {
    try {
      if (current) await studentService.trackFlashcardReview(current._id);
      setIndex((prev) => (cards.length ? (prev + 1) % cards.length : 0));
      setIsFlipped(false);
    } catch (err) {
      console.error('Failed to track review:', err);
    }
  };

  const difficultyClass = current?.difficulty === 'Hard'
    ? 'bg-rose-100 text-rose-700'
    : current?.difficulty === 'Medium'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <StudentLayout>
      <div className="mx-auto max-w-4xl">
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
        {current ? (
          <Card className="relative overflow-hidden border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-cyan-50/70">
            <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-indigo-300/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-cyan-300/25 blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {current.category?.name || 'General'}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClass}`}>
                  {current.difficulty}
                </span>
              </div>

              <div className="mb-4 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${((index + 1) / cards.length) * 100}%` }}
                />
              </div>

              <div className="[perspective:1200px]">
                <button
                  type="button"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="relative h-80 w-full rounded-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <div
                    className="relative h-full w-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d]"
                    style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  >
                    <div className="absolute inset-0 rounded-3xl border border-indigo-100 bg-white/90 p-7 shadow-[0_24px_60px_-28px_rgba(79,70,229,0.55)] [backface-visibility:hidden]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Question</p>
                      <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900">{current.question}</h2>
                      <p className="mt-8 text-sm text-slate-500">Tap card to reveal answer</p>
                    </div>

                    <div className="absolute inset-0 rounded-3xl border border-cyan-100 bg-slate-900 p-7 text-white shadow-[0_24px_60px_-28px_rgba(8,145,178,0.65)] [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Answer</p>
                      <p className="mt-4 text-xl leading-relaxed text-slate-100">{current.answer}</p>
                      <p className="mt-8 text-sm text-cyan-200">Tap card to view question again</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 text-sm text-slate-500">Course: {current.course?.title || 'General course'}</div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">{index + 1} of {cards.length}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsFlipped((prev) => !prev)}>
                    {isFlipped ? 'Show Question' : 'Reveal Answer'}
                  </Button>
                  <Button onClick={next}>Mark Reviewed & Next</Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card><div className="text-slate-500">No flashcards available yet.</div></Card>
        )}
      </div>
    </StudentLayout>
  );
}
