import { useEffect, useMemo, useRef, useState } from 'react';
import { ListVideo } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { studentService } from '../../services/studentService';
import { apiOrigin } from '../../services/apiConfig';

function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function toEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
    return '';
  } catch {
    return '';
  }
}

function formatDate(dateLike) {
  if (!dateLike) return 'Recently';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString();
}

function StarRating({ value = 0 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={value >= star ? 'text-amber-500' : 'text-slate-300'}>★</span>
      ))}
    </div>
  );
}

export default function MyCourseOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null); // { url, title, source, lessonIndex }
  const [isVideoListOpen, setIsVideoListOpen] = useState(false);
  const [completingLessonIndex, setCompletingLessonIndex] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const videoMenuRef = useRef(null);
  const tabPanelRef = useRef(null);

  const load = async () => {
    try {
      setError('');
      const response = await studentService.getCourseDetail(id);
      const courseData = response.data;

      if (!courseData.access?.isPaid) {
        navigate(`/student/courses/${id}`, { replace: true });
        return;
      }

      setData(courseData);

      const completed = Number(courseData?.progress?.completedModules || 0);
      const total = Number(courseData?.lessons?.length || 0);
      if (total > 0) {
        setActiveModuleIndex(Math.max(0, Math.min(completed, total - 1)));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load learning page.');
    }
  };

  useEffect(() => {
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!isVideoListOpen) return;

    const handleDocumentClick = (event) => {
      if (!videoMenuRef.current?.contains(event.target)) {
        setIsVideoListOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsVideoListOpen(false);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVideoListOpen]);

  useEffect(() => {
    if (!activeTab) return;

    const handleDocumentClick = (event) => {
      if (!tabPanelRef.current?.contains(event.target)) {
        setActiveTab('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setActiveTab('');
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeTab]);

  const modules = data?.lessons || [];
  const course = data?.course;
  const progress = data?.progress;
  const completionPercent = Number(progress?.completionPercent || 0);
  const completedModules = Number(progress?.completedModules || 0);

  const selectedModule = modules[activeModuleIndex] || null;

  const instructorVideos = useMemo(() => {
    return (data?.learningContent || []).filter((item) => item.contentType === 'video' && item.videoUrl);
  }, [data]);

  const instructorDocuments = useMemo(() => {
    return (data?.learningContent || []).filter((item) => item.contentType === 'document' && item.fileUrl);
  }, [data]);

  const storedVideos = useMemo(() => {
    const moduleVideos = modules
      .filter((m) => m.videoUrl)
      .map((m, i) => ({
        key: `module-${i}`,
        url: m.videoUrl,
        title: m.title,
        source: `Module ${i + 1}`,
        badge: 'Module',
        lessonIndex: i,
      }));

    const instructorVideoItems = instructorVideos.map((item) => ({
      key: `instructor-${item._id}`,
      url: item.videoUrl,
      title: item.title,
      source: `${item.instructor?.firstName || 'Instructor'} ${item.instructor?.lastName || ''}`.trim(),
      badge: 'Instructor',
    }));

    return [...moduleVideos, ...instructorVideoItems];
  }, [instructorVideos, modules]);

  const moduleDocuments = useMemo(() => {
    return modules
      .filter((item) => item.resource?.url)
      .map((item, index) => ({
        id: `module-resource-${index}`,
        title: item.resource.title || `${item.title} resource`,
        url: resolveAssetUrl(item.resource.url),
        source: 'Course module',
      }));
  }, [modules]);

  const allDocuments = useMemo(() => {
    const fromInstructor = instructorDocuments.map((item) => ({
      id: `instructor-doc-${item._id}`,
      title: item.title,
      url: resolveAssetUrl(item.fileUrl),
      source: `Instructor: ${item.instructor?.firstName || ''} ${item.instructor?.lastName || ''}`.trim(),
      createdAt: item.createdAt,
    }));
    return [...moduleDocuments, ...fromInstructor];
  }, [moduleDocuments, instructorDocuments]);

  const announcements = useMemo(() => {
    const fromCourse = (data?.announcements || []).map((item, index) => ({
      id: `course-announcement-${index}`,
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
      source: 'Course team',
    }));

    const fromInstructorContent = (data?.learningContent || [])
      .slice(0, 4)
      .map((item) => ({
        id: `content-${item._id}`,
        title: item.contentType === 'video' ? 'New video available' : 'New reading resource available',
        message: item.title,
        createdAt: item.createdAt,
        source: `${item.instructor?.firstName || ''} ${item.instructor?.lastName || ''}`.trim() || 'Instructor',
      }));

    return [...fromCourse, ...fromInstructorContent]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [data]);

  const reviews = data?.reviews || [];
  const reviewSummary = data?.reviewSummary || {
    rating: Number(course?.rating || 0),
    reviewCount: Number(course?.reviewCount || 0),
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      setSubmittingReview(true);
      await studentService.submitCourseReview(id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewForm((prev) => ({ ...prev, comment: '' }));
      await load();
      setActiveTab('reviews');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit your review right now.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (error) {
    return <StudentLayout><div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div></StudentLayout>;
  }

  if (!data || !course) {
    return (
      <StudentLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </StudentLayout>
    );
  }

  const thumbnailUrl = resolveAssetUrl(course.thumbnail);
  // Active video: override from instructor/module video click, or fall back to selected module
  const currentVideoUrl = activeVideo
    ? activeVideo.url
    : resolveAssetUrl(selectedModule?.videoUrl || '');
  const currentVideoTitle = activeVideo
    ? activeVideo.title
    : (selectedModule?.title || course.title);
  const embedUrl = toEmbedUrl(currentVideoUrl);

  const playVideo = (url, title, source, lessonIndex) => {
    setActiveVideo({ url: resolveAssetUrl(url), title, source, lessonIndex });
  };

  const clearActiveVideo = (moduleIndex) => {
    setActiveModuleIndex(moduleIndex);
    setActiveVideo(null);
  };

  const markLessonComplete = async (lessonIndex) => {
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0) return;
    if (completedModules >= lessonIndex + 1) return;
    if (completingLessonIndex === lessonIndex) return;

    try {
      setCompletingLessonIndex(lessonIndex);
      const response = await studentService.completeLesson(id, lessonIndex, true);
      const updatedProgress = response?.data?.progress;
      if (!updatedProgress) return;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: {
            ...prev.progress,
            ...updatedProgress,
          },
        };
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update module progress right now.');
    } finally {
      setCompletingLessonIndex(null);
    }
  };

  const handleMainVideoEnded = () => {
    if (Number.isInteger(activeVideo?.lessonIndex)) {
      markLessonComplete(activeVideo.lessonIndex);
      return;
    }

    if (!activeVideo) {
      markLessonComplete(activeModuleIndex);
    }
  };

  return (
    <StudentLayout>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-t-3xl bg-slate-950 lg:rounded-l-3xl lg:rounded-tr-none" ref={videoMenuRef}>
              <button
                type="button"
                onClick={() => setIsVideoListOpen((prev) => !prev)}
                className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/55"
              >
                <ListVideo size={14} /> Videos ({storedVideos.length})
              </button>

              {isVideoListOpen && (
                <div className="absolute right-4 top-16 z-20 w-[320px] max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stored Videos</p>
                  {!storedVideos.length && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No videos uploaded yet.</p>
                  )}
                  {!!storedVideos.length && (
                    <div className="mt-2 max-h-72 space-y-2 overflow-auto pr-1">
                      {storedVideos.map((item) => {
                        const resolvedUrl = resolveAssetUrl(item.url);
                        const isActive = currentVideoUrl === resolvedUrl;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              playVideo(item.url, item.title, item.source, item.lessonIndex);
                              setIsVideoListOpen(false);
                              setActiveTab('videos');
                            }}
                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-500">{item.source}</p>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.badge === 'Module' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                                {item.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {embedUrl ? (
                <iframe
                  title={currentVideoTitle}
                  src={embedUrl}
                  className="h-64 w-full md:h-96"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : currentVideoUrl ? (
                <video
                  key={currentVideoUrl}
                  controls
                  src={currentVideoUrl}
                  onEnded={handleMainVideoEnded}
                  className="h-64 w-full bg-black md:h-96"
                />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title} className="h-64 w-full object-cover opacity-90 md:h-96" />
              ) : (
                <div className="flex h-64 w-full items-center justify-center text-slate-400 md:h-96">
                  No lesson video selected
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-5 py-4">
                {activeVideo && (
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
                    {activeVideo.source || 'Instructor Video'}
                  </div>
                )}
                {!activeVideo && (
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Learning Player</div>
                )}
                <h1 className="mt-1 text-xl font-bold text-white md:text-2xl">{currentVideoTitle}</h1>
                <p className="mt-1 text-xs text-slate-200">{course.title} • {course.level}</p>
              </div>
            </div>

            {/* Fallback "Mark Module Complete" for iframe/embed videos */}
            {embedUrl && Number.isInteger(activeVideo?.lessonIndex) && (
              <div className="flex items-center justify-between rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 px-5 py-3">
                {completedModules >= activeVideo.lessonIndex + 1 ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Module complete
                  </span>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">Watching an embedded video? Mark it done when finished.</p>
                    <button
                      type="button"
                      disabled={completingLessonIndex === activeVideo.lessonIndex}
                      onClick={() => markLessonComplete(activeVideo.lessonIndex)}
                      className="ml-4 shrink-0 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {completingLessonIndex === activeVideo.lessonIndex ? 'Saving…' : 'Mark Module Complete'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div ref={tabPanelRef}>
              <div className="border-b border-slate-200 px-4 md:px-6">
                <div className="flex flex-wrap gap-2 py-3 text-sm">
                  {[
                    { id: 'overview', label: 'Overview & Notes' },
                    { id: 'videos', label: 'Videos' },
                    { id: 'announcements', label: 'Announcements' },
                    { id: 'reviews', label: 'Reviews' },
                    { id: 'resources', label: 'Downloadable Resources' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab((prev) => (prev === tab.id ? '' : tab.id))}
                      className={`rounded-full px-4 py-2 font-semibold transition ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={activeTab ? 'p-4 md:p-6' : 'hidden'}>
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Course Overview</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.overviewNotes || course.description}</p>
                  </div>

                  {selectedModule && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Module Notes</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {selectedModule.textContent || 'No notes uploaded for this module yet.'}
                      </p>
                      {selectedModule.resource?.url && (
                        <a
                          href={resolveAssetUrl(selectedModule.resource.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Open reading document
                        </a>
                      )}
                    </div>
                  )}

                  {instructorVideos.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">More Instructor Videos</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {instructorVideos.slice(0, 4).map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => playVideo(item.videoUrl, item.title, `By ${item.instructor?.firstName || 'Instructor'} ${item.instructor?.lastName || ''}`.trim())}
                            className="rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:bg-indigo-50 hover:border-indigo-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">▶</span>
                              <div>
                                <div className="font-semibold text-slate-900 line-clamp-2">{item.title}</div>
                                <div className="mt-0.5 text-xs text-slate-500">By {item.instructor?.firstName || 'Instructor'} {item.instructor?.lastName || ''}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {instructorVideos.length > 4 && (
                        <button type="button" onClick={() => setActiveTab('videos')} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">
                          View all {instructorVideos.length} videos →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'videos' && (() => {
                if (!storedVideos.length) {
                  return (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No videos uploaded yet.</div>
                  );
                }
                return (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Videos play only in the dedicated player above. Click the video icon to open all stored videos, then choose one to play.
                    </div>
                    {storedVideos.map((v) => {
                      const resolvedUrl = resolveAssetUrl(v.url);
                      const isActive = currentVideoUrl === resolvedUrl;
                      return (
                        <div
                          key={v.key}
                          className={`rounded-2xl border p-4 transition ${isActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              aria-label={`Play ${v.title}`}
                              onClick={() => playVideo(v.url, v.title, v.source, v.lessonIndex)}
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition ${isActive ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                              {isActive ? '■' : '▶'}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 truncate">{v.title}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{v.source}</div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.badge === 'Module' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                              {v.badge}
                            </span>
                          </div>
                          {isActive && <p className="mt-2 text-xs text-slate-500">Now playing in the dedicated player above.</p>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {activeTab === 'announcements' && (
                <div className="space-y-3">
                  {!announcements.length && (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No announcements yet.</div>
                  )}
                  {announcements.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500">Posted by {item.source}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-extrabold text-slate-900">{Number(reviewSummary.rating || 0).toFixed(1)}</div>
                      <div>
                        <StarRating value={Math.round(Number(reviewSummary.rating || 0))} />
                        <p className="mt-1 text-xs text-slate-500">{Number(reviewSummary.reviewCount || 0)} review(s)</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={submitReview} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Write a Review</h3>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Your rating</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={reviewForm.rating}
                        onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Comment</label>
                      <textarea
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Share what you liked, what improved your learning, and what can be better."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>

                  <div className="space-y-3">
                    {!reviews.length && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No reviews yet. Be the first to review this course.</div>}
                    {reviews.map((review, index) => (
                      <div key={`review-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-slate-900">
                            {review.student?.firstName || 'Student'} {review.student?.lastName || ''}
                          </div>
                          <span className="text-xs text-slate-500">{formatDate(review.updatedAt || review.createdAt)}</span>
                        </div>
                        <div className="mt-1"><StarRating value={Number(review.rating || 0)} /></div>
                        {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-3">
                  {!allDocuments.length && (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No downloadable resources uploaded yet.</div>
                  )}
                  {allDocuments.map((doc) => (
                    <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div>
                        <div className="font-semibold text-slate-900">{doc.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{doc.source || 'Course resource'}</div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Open
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your Progress</div>
              <div className="mt-2 text-sm text-slate-700">{completedModules} of {modules.length} modules completed</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
              </div>
              <div className="mt-1 text-xs text-slate-500">{completionPercent}% complete</div>

              {modules.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveModuleIndex(Math.max(0, Math.min(completedModules, modules.length - 1)))}
                  className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {completionPercent === 0 ? 'Get Started' : 'Continue Learning'}
                </button>
              )}

              {selectedModule && (
                <Link
                  to={`/student/courses/${id}/lessons/${selectedModule.lessonIndex}`}
                  className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open Focus Lesson View
                </Link>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Course Modules</h2>
              </div>
              <ul className="max-h-[500px] divide-y divide-slate-100 overflow-auto">
                {modules.map((module, index) => {
                  const isCompleted = index < completedModules;
                  const isActive = index === activeModuleIndex;
                  return (
                    <li key={`module-${index}`}>
                      <button
                        type="button"
                        onClick={() => clearActiveVideo(index)}
                        className={`w-full px-4 py-3 text-left transition ${isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module {index + 1}</div>
                            <div className="mt-0.5 text-sm font-medium text-slate-900">{module.title}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 capitalize">
                              {module.videoUrl && <span className="text-indigo-500">▶</span>}
                              {module.type} • {module.durationMinutes} min
                            </div>
                          </div>
                          {isCompleted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Done</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
                {!modules.length && <li className="px-4 py-4 text-sm text-slate-500">No modules added yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
