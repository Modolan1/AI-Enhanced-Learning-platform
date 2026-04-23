import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { studentService } from '../../services/studentService';
import { apiOrigin } from '../../services/apiConfig';

function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function StarRating({ value = 0 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(<span key={i} className="text-amber-400">â˜…</span>);
    } else if (value >= i - 0.5) {
      stars.push(<span key={i} className="text-amber-400">âœ¦</span>);
    } else {
      stars.push(<span key={i} className="text-slate-500">â˜†</span>);
    }
  }
  return <span className="text-base leading-none tracking-tight">{stars}</span>;
}

function ModuleTypeIcon({ type }) {
  if (type === 'video') {
    return (
      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'exercise' || type === 'project') {
    return (
      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [paymentBanner, setPaymentBanner] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [expandCurriculum, setExpandCurriculum] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(null); // { courseName, learnPath }
  const [payCountdown, setPayCountdown] = useState(5);
  const payCountdownRef = useRef(null);

  // Cleanup payment countdown on unmount
  useEffect(() => () => { if (payCountdownRef.current) clearInterval(payCountdownRef.current); }, []);

  const clearPaymentQueryParam = () => {
    const params = new URLSearchParams(location.search);
    if (!params.has('payment') && !params.has('session_id')) return;
    params.delete('payment');
    params.delete('session_id');
    const nextSearch = params.toString();
    window.history.replaceState(window.history.state, '', `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
  };

  const launchCheckout = (paymentData) => {
    if (!paymentData?.checkoutUrl) throw new Error('Stripe checkout session could not be created');
    const popup = window.open(paymentData.checkoutUrl, 'stripeCheckout', 'width=520,height=760');
    if (!popup) window.location.assign(paymentData.checkoutUrl);
  };

  const syncCourseAccess = async () => {
    const refreshed = await studentService.getCourseDetail(id);
    if (refreshed.data.access?.isPaid) {
      const learnPath = `/student/courses/${id}/learn`;
      const courseName = refreshed.data.course?.title || 'this course';
      setPayCountdown(5);
      setPaymentSuccessModal({ courseName, learnPath });
      payCountdownRef.current = setInterval(() => {
        setPayCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(payCountdownRef.current);
            setPaymentSuccessModal(null);
            navigate(learnPath, { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }
    setData(refreshed.data);
    setEnrolled(!!refreshed.data.access?.isEnrolled);
    return refreshed.data;
  };

  // Handle Stripe redirect back
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentState = params.get('payment');
    const sessionId = params.get('session_id');

    if (paymentState === 'cancel') {
      setPaymentBanner({ tone: 'warning', message: 'Payment was canceled. You can try again to unlock this course.' });
      clearPaymentQueryParam();
      return;
    }
    if (paymentState !== 'success') return;
    if (!sessionId) {
      setPaymentBanner({ tone: 'warning', message: 'Payment return is missing session details. Please try again.' });
      clearPaymentQueryParam();
      return;
    }

    setConfirmingPayment(true);
    setPaymentBanner({ tone: 'info', message: 'Payment successful. Confirming course unlock with Stripe...' });

    const timer = setTimeout(async () => {
      try {
        const confirmation = await studentService.confirmCoursePayment(id, sessionId);
        if (confirmation.data?.updated === false && confirmation.data?.reason === 'payment_not_completed') {
          setPaymentBanner({ tone: 'warning', message: 'Payment not completed yet. Please wait a moment and try again.' });
          return;
        }
        await syncCourseAccess();
      } catch {
        setPaymentBanner({ tone: 'warning', message: 'Unable to verify payment right now. Refresh this page in a moment.' });
      } finally {
        setConfirmingPayment(false);
        clearPaymentQueryParam();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [id, location.search]);

  // Load course data
  useEffect(() => {
    studentService.getCourseDetail(id)
      .then((res) => {
        const courseData = res.data;
        if (courseData.access?.isPaid) {
          navigate(`/student/courses/${id}/learn`, { replace: true });
          return;
        }
        setData(courseData);
        setEnrolled(!!courseData.access?.isEnrolled);
      })
      .catch((err) => {
        console.error('Failed to load course:', err);
        setError('Failed to load course');
      });
  }, [id]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError('');
      await studentService.enrollCourse(id);
      setEnrolled(true);
      setData((prev) => ({
        ...prev,
        access: { ...(prev?.access || {}), isEnrolled: true, isPaid: false, requiresPayment: true },
      }));
      const paymentResult = await studentService.payForCourse(id);
      if (paymentResult.data?.alreadyPaid) { await syncCourseAccess(); return; }
      launchCheckout(paymentResult.data);
    } catch (err) {
      console.error('Failed to enroll:', err);
      setError(err?.response?.data?.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handlePayForCourse = async () => {
    try {
      setPaying(true);
      setError('');
      const result = await studentService.payForCourse(id);
      if (result.data?.alreadyPaid) { await syncCourseAccess(); return; }
      launchCheckout(result.data);
    } catch (err) {
      console.error('Failed to start payment:', err);
      setError(err?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    try {
      setSubmittingReview(true);
      setError('');
      await studentService.submitCourseReview(id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      // Reload the course data to show updated rating
      await studentService.getCourseDetail(id);
      setData((prevData) => {
        const updated = { ...prevData };
        if (!updated.course) return prevData;
        updated.course.reviews = updated.course.reviews || [];
        const existingIdx = updated.course.reviews.findIndex((r) => String(r.student?._id) === String(r.student || ''));
        if (existingIdx >= 0) {
          updated.course.reviews[existingIdx] = {
            ...updated.course.reviews[existingIdx],
            rating: Number(reviewForm.rating),
            comment: reviewForm.comment,
          };
        } else {
          updated.course.reviews.push({
            student: { firstName: 'You', lastName: '' },
            rating: Number(reviewForm.rating),
            comment: reviewForm.comment,
          });
        }
        const visibleReviews = (updated.course.reviews || []).filter((r) => !r.isHidden && r.moderationStatus !== 'hidden' && r.moderationStatus !== 'reported');
        const avgRating = visibleReviews.length ? Number((visibleReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / visibleReviews.length).toFixed(1)) : 0;
        updated.course.rating = avgRating;
        updated.course.reviewCount = visibleReviews.length;
        return updated;
      });
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err?.response?.data?.message || 'Unable to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (error) {
    return <StudentLayout><div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div></StudentLayout>;
  }

  if (!data) {
    return (
      <StudentLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </StudentLayout>
    );
  }

  const { course, access } = data;
  const modules = course.modules || [];
  const totalMinutes = modules.reduce((sum, m) => sum + (m.durationMinutes || 0), 0);
  const totalHoursDisplay = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ''}`
    : `${totalMinutes}m`;
  const rating = Number(course.rating || 0);
  const reviewCount = Number(course.reviewCount || 0);
  const enrolledCount = Number(access?.enrolledCount || 0);
  const thumbnailUrl = resolveAssetUrl(course.thumbnail);
  const price = Number(access?.price || course.price || 0);
  const currency = access?.currency || course.currency || 'USD';
  const visibleModules = expandCurriculum ? modules : modules.slice(0, 5);

  const levelColor = { Beginner: 'bg-emerald-100 text-emerald-700', Intermediate: 'bg-amber-100 text-amber-700', Advanced: 'bg-rose-100 text-rose-700' };

  return (
    <StudentLayout>
      {/* Payment banner */}
      {paymentBanner && (
        <div className={`-mx-4 -mt-4 mb-4 flex items-center gap-2 px-5 py-3 text-sm ${
          paymentBanner.tone === 'success' ? 'bg-emerald-50 text-emerald-700' :
          paymentBanner.tone === 'warning' ? 'bg-amber-50 text-amber-700' :
          'bg-sky-50 text-sky-700'
        }`}>
          {confirmingPayment && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />}
          {paymentBanner.message}
        </div>
      )}

      {/* â”€â”€ Dark hero banner â”€â”€ */}
      <div className="-mx-4 -mt-4 bg-slate-900 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-screen-xl">
          <div className="lg:max-w-[62%]">
            {/* Breadcrumb */}
            <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Link to="/student/courses" className="hover:text-slate-200 transition">Courses</Link>
              <span>â€º</span>
              {course.category?.name && (
                <><span className="text-slate-300">{course.category.name}</span><span>â€º</span></>
              )}
              <span className="text-slate-500 max-w-[220px] truncate">{course.title}</span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl font-extrabold leading-tight text-white lg:text-[2.2rem]">
              {course.title}
            </h1>

            {/* Short description */}
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-300 line-clamp-3">
              {course.description}
            </p>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">{rating.toFixed(1)}</span>
                  <StarRating value={rating} />
                  {reviewCount > 0 && (
                    <span className="text-slate-400 text-xs">({reviewCount.toLocaleString()} ratings)</span>
                  )}
                </div>
              ) : (
                <span className="text-xs italic text-slate-500">No ratings yet</span>
              )}

              <div className="flex items-center gap-1.5 text-slate-300">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {enrolledCount > 0
                  ? <span><strong className="text-white">{formatCount(enrolledCount)}</strong> students enrolled</span>
                  : <span className="italic text-slate-500 text-xs">Be the first to enroll</span>
                }
              </div>

              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelColor[course.level] || 'bg-slate-700 text-slate-300'}`}>
                {course.level}
              </span>
            </div>

            {/* Duration + module count */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {totalHoursDisplay} total
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {modules.length} lesson{modules.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                English
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Page body â”€â”€ */}
      <div className="mx-auto max-w-screen-xl py-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* â”€â”€â”€â”€ Left main â”€â”€â”€â”€ */}
          <div className="lg:col-span-2 space-y-7">

            {/* What you'll learn */}
            {modules.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-900">What you'll learn</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {modules.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{m.title}</span>
                    </div>
                  ))}
                  {modules.length > 8 && (
                    <div className="flex items-start gap-2 text-sm italic text-slate-400">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      And {modules.length - 8} more topicsâ€¦
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* About */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-slate-900">About this course</h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">{course.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Lessons', value: modules.length },
                  { label: 'Total time', value: totalHoursDisplay },
                  { label: 'Level', value: course.level },
                  { label: 'Students', value: enrolledCount > 0 ? formatCount(enrolledCount) : 'â€”' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                    <div className="text-lg font-bold text-slate-900">{value}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Course content</h2>
                <span className="text-sm text-slate-500">{modules.length} lessons Â· {totalHoursDisplay}</span>
              </div>
              {modules.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">No lessons added yet.</p>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100">
                    {visibleModules.map((module, idx) => (
                      <li key={idx} className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-slate-50">
                        <ModuleTypeIcon type={module.type} />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-slate-800">{idx + 1}. {module.title}</span>
                          <span className="ml-2 text-xs capitalize text-slate-400">{module.type}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                          {/* lock icon â€” content locked until paid */}
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {module.durationMinutes} min
                        </div>
                      </li>
                    ))}
                  </ul>
                  {modules.length > 5 && (
                    <div className="border-t border-slate-100 px-6 py-3 text-center">
                      <button
                        onClick={() => setExpandCurriculum((v) => !v)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {expandCurriculum ? 'â–² Show less' : `â–¼ Show all ${modules.length} lessons`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Reviews Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Course Reviews</h2>
              
              {/* Rating Summary */}
              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-4xl font-bold text-slate-900">{rating.toFixed(1)}</div>
                    <StarRating value={Math.round(rating)} />
                    <p className="mt-1 text-sm text-slate-600">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Review Form - Only show for paid students */}
              {data?.access?.isPaid && (
                <form onSubmit={handleSubmitReview} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">Share Your Feedback</h3>
                  <div className="mb-3">
                    <label className="mb-2 block text-xs font-medium text-slate-600">Your Rating</label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {[5, 4, 3, 2, 1].map((star) => (
                        <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="mb-2 block text-xs font-medium text-slate-600">Comment (Optional)</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                      maxLength={1000}
                      rows={3}
                      placeholder="Share what you liked, what you learned, and suggestions for improvement..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="mt-1 text-xs text-slate-500">{reviewForm.comment.length}/1000</div>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {!data?.access?.isPaid && (
                <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                  <p>Complete payment to unlock the ability to review this course.</p>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {(data?.course?.reviews || []).filter((r) => !r.isHidden && r.moderationStatus !== 'hidden' && r.moderationStatus !== 'reported').length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">No reviews yet. Be the first to review!</p>
                ) : (
                  (data?.course?.reviews || [])
                    .filter((r) => !r.isHidden && r.moderationStatus !== 'hidden' && r.moderationStatus !== 'reported')
                    .map((review, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-semibold text-slate-900">
                            {review.student?.firstName || 'Student'} {review.student?.lastName || ''}
                          </div>
                          <div className="text-xs text-slate-500">
                            {review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mb-2"><StarRating value={Number(review.rating || 0)} /></div>
                        {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
                      </div>
                    ))
                )}
              </div>
            </section>
          </div>

          {/* â”€â”€â”€â”€ Right sticky sidebar â”€â”€â”€â”€ */}
          <div>
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              {/* Thumbnail */}
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-200">
                  <svg className="h-14 w-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}

              <div className="p-5">
                {/* Price */}
                <div className="mb-4 flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{currency} {price.toFixed(2)}</span>
                </div>

                {/* CTA button */}
                {!enrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
                  >
                    {enrolling ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processingâ€¦
                      </span>
                    ) : 'Enroll Now'}
                  </button>
                ) : (
                  <button
                    onClick={handlePayForCourse}
                    disabled={paying}
                    className="w-full rounded-xl bg-amber-500 py-3.5 text-base font-bold text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
                  >
                    {paying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Opening paymentâ€¦
                      </span>
                    ) : 'Complete Payment to Unlock'}
                  </button>
                )}

                {enrolled && (
                  <p className="mt-2 text-center text-xs text-amber-600">
                    You're enrolled â€” complete payment to access all content.
                  </p>
                )}

                <p className="mt-3 text-center text-xs text-slate-400">30-day money-back guarantee</p>

                <hr className="my-4 border-slate-100" />

                {/* Course includes */}
                <h3 className="mb-3 text-sm font-bold text-slate-900">This course includes:</h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  {[
                    {
                      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                      text: `${totalHoursDisplay} of on-demand content`,
                    },
                    {
                      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                      text: `${modules.length} structured lesson${modules.length !== 1 ? 's' : ''}`,
                    },
                    {
                      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                      text: `${course.level} level`,
                    },
                    {
                      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                      text: 'AI-powered study tools',
                    },
                    {
                      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
                      text: 'Memory cards & quizzes included',
                    },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Success Modal */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Payment Successful!</h2>
            <p className="mt-2 text-slate-500">
              You now have full access to{' '}
              <span className="font-semibold text-slate-800">{paymentSuccessModal.courseName}</span>.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Taking you to the course in{' '}
              <span className="font-bold text-indigo-600">{payCountdown}</span>{' '}
              second{payCountdown !== 1 ? 's' : ''}…
            </p>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                style={{ width: `${((5 - payCountdown) / 5) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                clearInterval(payCountdownRef.current);
                const path = paymentSuccessModal.learnPath;
                setPaymentSuccessModal(null);
                navigate(path, { replace: true });
              }}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Start Learning Now
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
