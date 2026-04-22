import { userRepository } from '../repositories/userRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { quizRepository } from '../repositories/quizRepository.js';
import { quizAttemptRepository } from '../repositories/quizAttemptRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { recommendationRepository } from '../repositories/recommendationRepository.js';
import { flashcardRepository } from '../repositories/flashcardRepository.js';
import { documentStudyPackRepository } from '../repositories/documentStudyPackRepository.js';
import { instructorContentRepository } from '../repositories/instructorContentRepository.js';
import { aiRecommendationService } from './aiRecommendationService.js';
import { aiDocumentService } from './aiDocumentService.js';
import { stripeService } from './stripeService.js';
import { env } from '../config/env.js';
import { PDFParse } from 'pdf-parse';

const DEFAULT_FAQ = [
  {
    question: 'How should I study this lesson effectively?',
    answer: 'Use a 3-step loop: skim lesson goals, study for 20-30 minutes, then self-check with quiz questions or flashcards.',
  },
  {
    question: 'What should I do if I fail a quiz?',
    answer: 'Review incorrect questions first, revisit the related lesson module, and retry after summarizing key concepts in your own words.',
  },
  {
    question: 'How often should I revise?',
    answer: 'Aim for quick reviews within 24 hours, then again after 3 days and 7 days for better long-term retention.',
  },
];

const buildLessonText = (courseTitle, module, index) => {
  if (module.textContent) return module.textContent;

  return `Lesson ${index + 1}: ${module.title}\n\nThis lesson is part of ${courseTitle}. Focus on understanding the core idea, then apply it with a short practice task. Finish by writing a quick 3-bullet summary of what you learned.`;
};

const normalizeLesson = (course, module, index) => ({
  lessonIndex: index,
  title: module.title,
  type: module.type,
  durationMinutes: module.durationMinutes || 20,
  textContent: buildLessonText(course.title, module, index),
  videoUrl: module.videoUrl || '',
  resource: module.resourceUrl
    ? {
      url: module.resourceUrl,
      title: module.resourceTitle || `${module.title} Resource`,
    }
    : null,
});

const getCourseAttempts = (attempts, courseId) => attempts.filter((attempt) => String(attempt?.quiz?.course?._id || attempt?.quiz?.course) === String(courseId));

const buildRevisionTopics = (quizzes, courseAttempts) => {
  const quizById = new Map(quizzes.map((quiz) => [String(quiz._id), quiz]));
  const topics = new Map();

  courseAttempts.forEach((attempt) => {
    const quiz = quizById.get(String(attempt?.quiz?._id || attempt?.quiz));
    if (!quiz) return;

    quiz.questions.forEach((question, index) => {
      if ((attempt.answers || [])[index] === question.correctAnswer) return;
      const key = question.questionText || `Question ${index + 1}`;
      topics.set(key, (topics.get(key) || 0) + 1);
    });
  });

  return [...topics.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, missedCount]) => ({ topic, missedCount }));
};

const buildStudyHelper = ({ course, progress, quizzes, attempts }) => {
  const lessons = (course.modules || []).map((module, index) => normalizeLesson(course, module, index));
  const completedModules = progress?.completedModules || 0;
  const nextIndex = lessons.length ? Math.min(completedModules, lessons.length - 1) : 0;
  const recommendedNextLesson = lessons.length
    ? {
      ...lessons[nextIndex],
      isAlreadyCompleted: nextIndex < completedModules,
    }
    : null;

  const courseAttempts = getCourseAttempts(attempts, course._id);
  const suggestedRevisionTopics = buildRevisionTopics(quizzes, courseAttempts);

  return {
    recommendedNextLesson,
    suggestedRevisionTopics,
    faq: DEFAULT_FAQ,
  };
};

const getEnrolledCourseIds = (progress = []) => new Set(
  progress
    .map((item) => String(item?.course?._id || item?.course || ''))
    .filter(Boolean)
);

const getPaidCourseIds = (progress = []) => new Set(
  progress
    .filter((item) => item?.paymentStatus === 'paid')
    .map((item) => String(item?.course?._id || item?.course || ''))
    .filter(Boolean)
);

const filterByEnrolledCourse = (items = [], enrolledCourseIds, getCourseId) => items.filter((item) => {
  const courseId = String(getCourseId(item) || '');
  return courseId && enrolledCourseIds.has(courseId);
});

const getVisibleReviews = (reviews = []) => reviews.filter((item) => !item?.isHidden && item?.moderationStatus !== 'hidden' && item?.moderationStatus !== 'reported');
const NON_ENROLLED_DOCUMENT_UPLOAD_LIMIT = 3;

const computeVisibleReviewSummary = (reviews = []) => {
  const visibleReviews = getVisibleReviews(reviews);
  const reviewCount = visibleReviews.length;
  const rating = reviewCount
    ? Number((visibleReviews.reduce((sum, item) => sum + Number(item?.rating || 0), 0) / reviewCount).toFixed(1))
    : 0;
  return { rating, reviewCount, visibleReviews };
};

const buildRecommendationSummary = ({ student, attempts, progress, activities, flashcards, context = {} }) => {
  const avgQuizScore = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length) : 0;
  const completedCourses = progress.filter((item) => Number(item.completionPercent || 0) >= 100).length;
  const inProgressCourses = progress.filter((item) => Number(item.completionPercent || 0) > 0 && Number(item.completionPercent || 0) < 100).length;
  const weakTopics = [];

  const latestProgress = context.courseId
    ? progress.find((item) => String(item?.course?._id || item?.course) === String(context.courseId))
    : progress[0];

  const courseAttempts = context.courseId
    ? attempts.filter((attempt) => String(attempt?.quiz?.course?._id || attempt?.quiz?.course) === String(context.courseId))
    : [];

  const courseAvgScore = courseAttempts.length
    ? Math.round(courseAttempts.reduce((sum, attempt) => sum + Number(attempt?.percentage || 0), 0) / courseAttempts.length)
    : avgQuizScore;

  return {
    avgQuizScore,
    quizAttempts: attempts.length,
    totalQuizAttempts: attempts.length,
    completedCourses,
    inProgressCourses,
    flashcardReviews: activities.filter((item) => item.activityType === 'flashcard_review').length,
    totalFlashcardsAvailable: flashcards.length,
    preferredSubject: student.preferredSubject,
    preferredLearningStyle: student.preferredLearningStyle,
    learningGoal: student.learningGoal,
    recommendedNextLesson: context.lessonTitle || '',
    recommendedNextCourse: context.nextCourseTitle || '',
    weakTopics,
    lastCompletedCourse: context.courseCompleted
      ? {
        title: context.courseTitle || latestProgress?.course?.title || 'recent course',
        score: courseAvgScore,
      }
      : null,
  };
};

const safeGenerateRecommendation = async (studentId, context = {}) => {
  try {
    const student = await userRepository.findStudentById(studentId);
    if (!student) return null;

    const [attempts, progress, activities, flashcards] = await Promise.all([
      quizAttemptRepository.findByStudent(studentId),
      progressRepository.findByStudent(studentId),
      activityRepository.findByStudent(studentId),
      flashcardRepository.findAll(),
    ]);

    const summary = buildRecommendationSummary({
      student,
      attempts,
      progress,
      activities,
      flashcards,
      context,
    });

    return await aiRecommendationService.generateAndSave(student, summary, context);
  } catch (error) {
    console.warn('Recommendation auto-refresh skipped:', error.message);
    return null;
  }
};

export const studentService = {
  getProfile: (studentId) => userRepository.findStudentById(studentId),

  async updateProfile(studentId, data) {
    const profile = await userRepository.updateById(studentId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      learningGoal: data.learningGoal,
      skillLevel: data.skillLevel,
      preferredSubject: data.preferredSubject,
      preferredLearningStyle: data.preferredLearningStyle,
      weeklyLearningGoalHours: data.weeklyLearningGoalHours,
    });

    await activityRepository.create({
      student: studentId,
      activityType: 'profile_update',
      resourceType: 'profile',
      metadata: { updated: true },
    });

    return profile;
  },

  async getDashboard(studentId) {
    const [student, attempts, progress, recommendations, recentActivity, flashcards, quizzes, documentCount] = await Promise.all([
      userRepository.findStudentById(studentId),
      quizAttemptRepository.findByStudent(studentId),
      progressRepository.findByStudent(studentId),
      recommendationRepository.findByStudent(studentId),
      activityRepository.findRecentByStudent(studentId, 8),
      flashcardRepository.findAll(),
      quizRepository.findAll(),
      documentStudyPackRepository.countByStudent(studentId),
    ]);

    const enrolledCourseIds = getPaidCourseIds(progress);
    const enrolledCourses = progress.map((item) => item.course).filter(Boolean);
    const paidCourses = progress.filter((item) => item.paymentStatus === 'paid').map((item) => item.course).filter(Boolean);
    const enrolledFlashcards = filterByEnrolledCourse(flashcards, enrolledCourseIds, (item) => item?.course?._id || item?.course);
    const enrolledQuizzes = filterByEnrolledCourse(quizzes, enrolledCourseIds, (item) => item?.course?._id || item?.course);

    const enrolledLessons = progress.filter((item) => item.paymentStatus === 'paid').flatMap((item) => {
      const course = item.course;
      const modules = course?.modules || [];
      return modules.map((module, index) => ({
        courseId: course?._id,
        courseTitle: course?.title,
        lessonIndex: index,
        title: module.title,
        type: module.type,
        durationMinutes: module.durationMinutes || 20,
        isCompleted: index < (item.completedModules || 0),
      }));
    });

    const avgQuizScore = attempts.length
      ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length)
      : 0;

    const realRecentActivity = (recentActivity || []).filter((item) => item.activityType !== 'course_view');

    return {
      student,
      stats: {
        enrolledCourses: paidCourses.length,
        completedModules: progress.reduce((sum, item) => sum + item.completedModules, 0),
        avgQuizScore,
        recommendations: recommendations.length,
        flashcards: enrolledFlashcards.length,
        quizzes: enrolledQuizzes.length,
        lessons: enrolledLessons.length,
        documents: documentCount,
      },
      courses: paidCourses.slice(0, 6),
      quizzes: enrolledQuizzes.slice(0, 8),
      flashcards: enrolledFlashcards.slice(0, 8),
      lessons: enrolledLessons.slice(0, 10),
      progress,
      attempts: attempts.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
      recentActivity: realRecentActivity,
      topCategories: paidCourses.reduce((acc, course) => {
        const name = course.category?.name || 'General';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {}),
    };
  },

  async listCourses(studentId) {
    const courses = await courseRepository.findAllPublished();
    return courses;
  },

  async getCourseDetail(studentId, courseId) {
    const [course, quizzes, flashcards, progress, attempts, enrolledCount] = await Promise.all([
      courseRepository.findById(courseId),
      quizRepository.findByCourse(courseId),
      flashcardRepository.findByCourse(courseId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
      quizAttemptRepository.findByStudent(studentId),
      progressRepository.countPaidByCourse(courseId),
    ]);
    if (!course) throw new Error('Course not found');

    const categoryId = course.category?._id || course.category;
    const learningContent = categoryId
      ? await instructorContentRepository.findPublishedByCategory(categoryId)
      : [];

    await activityRepository.create({
      student: studentId,
      activityType: 'course_detail_view',
      resourceType: 'course',
      resourceId: course._id,
      metadata: { title: course.title },
    });

    const isEnrolled = Boolean(progress);
    const isPaid = progress?.paymentStatus === 'paid';
    const sortedAnnouncements = [...(course.announcements || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const { rating: visibleRating, reviewCount: visibleReviewCount, visibleReviews } = computeVisibleReviewSummary(course.reviews || []);
    const sortedReviews = [...visibleReviews].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    return {
      course,
      overviewNotes: course.overviewNotes || course.description || '',
      announcements: isPaid ? sortedAnnouncements : [],
      reviews: isPaid ? sortedReviews : [],
      reviewSummary: {
        rating: Number(visibleRating || 0),
        reviewCount: Number(visibleReviewCount || 0),
      },
      lessons: isPaid ? (course.modules || []).map((module, index) => normalizeLesson(course, module, index)) : [],
      quizzes: isPaid ? quizzes : [],
      flashcards: isPaid ? flashcards : [],
      learningContent: isPaid ? learningContent : [],
      progress: progress || {
        paymentStatus: 'pending',
        amountPaid: 0,
        currency: course.currency || 'USD',
        paidAt: null,
        completedModules: 0,
        totalModules: course.modules?.length || 0,
        completionPercent: 0,
      },
      access: {
        isEnrolled,
        isPaid,
        requiresPayment: isEnrolled && !isPaid,
        price: Number(course.price || 0),
        currency: course.currency || 'USD',
        enrolledCount,
      },
      studyHelper: buildStudyHelper({
        course,
        progress,
        quizzes,
        attempts,
      }),
    };
  },

  async submitCourseReview(studentId, courseId, payload = {}) {
    const [course, progress] = await Promise.all([
      courseRepository.findById(courseId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
    ]);

    if (!course) throw new Error('Course not found');
    if (!progress) throw new Error('Please enroll in the course before posting a review');
    if (progress.paymentStatus !== 'paid') throw new Error('Payment required. Please complete course payment to post a review.');

    const rating = Number(payload.rating || 0);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    const comment = String(payload.comment || '').trim();
    const reviews = [...(course.reviews || [])];
    const existingIndex = reviews.findIndex((item) => String(item.student?._id || item.student) === String(studentId));

    if (existingIndex >= 0) {
      reviews[existingIndex] = {
        ...reviews[existingIndex],
        student: studentId,
        rating,
        comment,
        moderationStatus: reviews[existingIndex].moderationStatus || 'visible',
        isHidden: Boolean(reviews[existingIndex].isHidden),
        updatedAt: new Date(),
      };
    } else {
      reviews.push({
        student: studentId,
        rating,
        comment,
        moderationStatus: 'visible',
        isHidden: false,
      });
    }

    const { rating: averageRating, reviewCount } = computeVisibleReviewSummary(reviews);

    course.reviews = reviews;
    course.reviewCount = reviewCount;
    course.rating = averageRating;
    await course.save();

    await activityRepository.create({
      student: studentId,
      activityType: 'course_review',
      resourceType: 'course',
      resourceId: courseId,
      metadata: {
        title: course.title,
        rating,
      },
    });

    const refreshed = await courseRepository.findById(courseId);
    const { visibleReviews } = computeVisibleReviewSummary(refreshed?.reviews || []);
    const sortedReviews = [...visibleReviews].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    return {
      rating: Number(refreshed?.rating || averageRating),
      reviewCount: Number(refreshed?.reviewCount || reviewCount),
      reviews: sortedReviews,
    };
  },

  async getLessonDetail(studentId, courseId, lessonIndex) {
    const [course, quizzes, progress, attempts] = await Promise.all([
      courseRepository.findById(courseId),
      quizRepository.findByCourse(courseId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
      quizAttemptRepository.findByStudent(studentId),
    ]);

    if (!course) throw new Error('Course not found');
    const modules = course.modules || [];
    if (!modules.length) throw new Error('No lessons are available for this course');
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= modules.length) {
      throw new Error('Lesson not found');
    }

    if (!progress) throw new Error('Please enroll in the course to access lessons');
    if (progress.paymentStatus !== 'paid') throw new Error('Payment required. Please complete course payment to access lessons.');

    const lesson = normalizeLesson(course, modules[lessonIndex], lessonIndex);
    const completedModules = progress?.completedModules || 0;

    await activityRepository.create({
      student: studentId,
      activityType: 'lesson_view',
      resourceType: 'lesson',
      resourceId: course._id,
      metadata: {
        courseTitle: course.title,
        lessonTitle: lesson.title,
        lessonIndex,
      },
    });

    return {
      course: {
        _id: course._id,
        title: course.title,
        level: course.level,
        category: course.category,
      },
      lesson,
      progress: {
        completedModules,
        totalModules: modules.length,
        completionPercent: modules.length ? Math.round((completedModules / modules.length) * 100) : 0,
      },
      navigation: {
        previousLessonIndex: lessonIndex > 0 ? lessonIndex - 1 : null,
        nextLessonIndex: lessonIndex < modules.length - 1 ? lessonIndex + 1 : null,
      },
      studyHelper: buildStudyHelper({
        course,
        progress,
        quizzes,
        attempts,
      }),
    };
  },

  async enrollCourse(studentId, courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const existingEnrollments = await progressRepository.findByStudent(studentId);
    const isFirstEnrollment = existingEnrollments.length === 0;

    const existingProgress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (existingProgress) {
      return existingProgress;
    }

    const newProgress = await progressRepository.upsert(studentId, courseId, {
      paymentStatus: 'pending',
      amountPaid: 0,
      currency: course.currency || 'USD',
      paymentProvider: '',
      paymentReference: '',
      paidAt: null,
      accessGrantedAt: null,
      completedModules: 0,
      totalModules: course.modules?.length || 10,
      completionPercent: 0,
      lastAccessedAt: new Date(),
    });

    await activityRepository.create({
      student: studentId,
      activityType: 'course_enrollment',
      resourceType: 'course',
      resourceId: courseId,
      metadata: { title: course.title },
    });

    if (isFirstEnrollment) {
      await safeGenerateRecommendation(studentId, {
        trigger: 'first_course_enrollment',
        courseId,
        courseTitle: course.title,
      });
    }

    return newProgress;
  },

  async payForCourse(studentId, courseId, payload = {}) {
    return studentService.createStripeCourseCheckoutSession(studentId, courseId, payload);
  },

  async createStripeCourseCheckoutSession(studentId, courseId) {
    const [course, student, existingProgress] = await Promise.all([
      courseRepository.findById(courseId),
      userRepository.findStudentById(studentId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
    ]);

    if (!course) throw new Error('Course not found');
    if (!student) throw new Error('Student not found');
    if (!existingProgress) throw new Error('Please enroll in the course before making payment');

    if (existingProgress.paymentStatus === 'paid') {
      return {
        alreadyPaid: true,
        access: {
          isEnrolled: true,
          isPaid: true,
          requiresPayment: false,
          price: Number(course.price || 0),
          currency: course.currency || 'USD',
        },
      };
    }

    const paymentReference = `COURSE-${courseId}-STUDENT-${studentId}-${Date.now()}`;
    const unitAmount = Math.round(Number(course.price || 0) * 100);
    if (unitAmount <= 0) throw new Error('Invalid course price for Stripe checkout');

    const session = await stripeService.createCheckoutSession({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: student.email,
      success_url: `${env.clientUrl}/student/courses/${courseId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientUrl}/student/courses/${courseId}?payment=cancel`,
      line_items: [
        {
          price_data: {
            currency: String(course.currency || 'USD').toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: course.title,
              description: `Course access for ${course.title}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        studentId: String(studentId),
        courseId: String(courseId),
        paymentReference,
      },
    });

    await progressRepository.upsert(studentId, courseId, {
      paymentStatus: 'pending',
      amountPaid: 0,
      currency: course.currency || 'USD',
      paymentProvider: 'stripe',
      paymentReference,
      paidAt: null,
      accessGrantedAt: null,
      lastAccessedAt: new Date(),
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentReference,
      access: {
        isEnrolled: true,
        isPaid: false,
        requiresPayment: true,
        price: Number(course.price || 0),
        currency: course.currency || 'USD',
      },
    };
  },

  async confirmStripeCoursePayment(studentId, courseId, sessionId) {
    if (!sessionId) throw new Error('Checkout session id is required');

    const [course, progress] = await Promise.all([
      courseRepository.findById(courseId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
    ]);

    if (!course) throw new Error('Course not found');
    if (!progress) throw new Error('Please enroll in the course before confirming payment');

    if (progress.paymentStatus === 'paid') {
      return {
        updated: false,
        reason: 'already_paid',
        access: {
          isEnrolled: true,
          isPaid: true,
          requiresPayment: false,
          price: Number(course.price || 0),
          currency: course.currency || 'USD',
        },
      };
    }

    const session = await stripeService.retrieveCheckoutSession(sessionId);
    const sessionCourseId = String(session?.metadata?.courseId || '');
    const sessionStudentId = String(session?.metadata?.studentId || '');

    if (sessionCourseId !== String(courseId) || sessionStudentId !== String(studentId)) {
      throw new Error('Invalid checkout session for this student or course');
    }

    if (session.payment_status !== 'paid') {
      return {
        updated: false,
        reason: 'payment_not_completed',
        access: {
          isEnrolled: true,
          isPaid: false,
          requiresPayment: true,
          price: Number(course.price || 0),
          currency: course.currency || 'USD',
        },
      };
    }

    const now = new Date();
    const amountPaid = Number.isFinite(session.amount_total) ? Number(session.amount_total) / 100 : Number(course.price || 0);

    const updatedProgress = await progressRepository.upsert(studentId, courseId, {
      paymentStatus: 'paid',
      amountPaid,
      currency: String(session.currency || course.currency || 'USD').toUpperCase(),
      paymentProvider: 'stripe',
      paymentReference: session.metadata?.paymentReference || progress.paymentReference || `STRIPE-${session.id}`,
      paidAt: now,
      accessGrantedAt: now,
      lastAccessedAt: now,
    });

    await activityRepository.create({
      student: studentId,
      activityType: 'course_payment',
      resourceType: 'course',
      resourceId: courseId,
      metadata: {
        title: course.title,
        amountPaid,
        currency: String(session.currency || course.currency || 'USD').toUpperCase(),
        provider: 'stripe',
        sessionId,
      },
    });

    return {
      updated: true,
      progress: updatedProgress,
      access: {
        isEnrolled: true,
        isPaid: true,
        requiresPayment: false,
        price: Number(course.price || 0),
        currency: course.currency || 'USD',
      },
    };
  },

  async completeLesson(studentId, courseId, lessonIndex, completed = true) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const modules = course.modules || [];
    if (!modules.length) throw new Error('No lessons are available for this course');
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= modules.length) {
      throw new Error('Lesson not found');
    }

    const existingProgress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (!existingProgress) throw new Error('Please enroll in the course before completing lessons');
    const currentCompleted = existingProgress?.completedModules || 0;
    const previousCompletionPercent = Number(existingProgress?.completionPercent || 0);
    const nextCompleted = completed
      ? Math.max(currentCompleted, lessonIndex + 1)
      : Math.min(currentCompleted, lessonIndex);
    const completionPercent = modules.length ? Math.round((nextCompleted / modules.length) * 100) : 0;

    const updatedProgress = await progressRepository.upsert(studentId, courseId, {
      completedModules: nextCompleted,
      totalModules: modules.length,
      completionPercent,
      lastAccessedAt: new Date(),
    });

    await activityRepository.create({
      student: studentId,
      activityType: completed ? 'lesson_complete' : 'lesson_reopen',
      resourceType: 'lesson',
      resourceId: course._id,
      metadata: {
        lessonTitle: modules[lessonIndex].title,
        lessonIndex,
        courseTitle: course.title,
      },
    });

    if (completed) {
      await safeGenerateRecommendation(studentId, {
        trigger: 'lesson_complete',
        courseId,
        courseTitle: course.title,
        lessonTitle: modules[lessonIndex].title,
        completionPercent,
      });

      if (previousCompletionPercent < 100 && completionPercent >= 100) {
        await safeGenerateRecommendation(studentId, {
          trigger: 'course_complete',
          courseId,
          courseTitle: course.title,
          courseCompleted: true,
          completionPercent,
        });
      }
    }

    return {
      progress: updatedProgress,
      nextRecommendedLessonIndex: nextCompleted < modules.length ? nextCompleted : modules.length - 1,
    };
  },

  async getSubscription(studentId) {
    const student = await userRepository.findStudentById(studentId);
    if (!student) throw new Error('Student not found');

    return {
      status: student.subscriptionStatus || 'none',
      plan: student.subscriptionPlan || 'monthly',
      renewsAt: student.subscriptionRenewsAt,
      isSubscribed: ['trial', 'active'].includes(student.subscriptionStatus),
    };
  },

  async simulateSubscription(studentId, payload) {
    const status = payload?.status;
    const plan = payload?.plan || 'monthly';
    const renewsAt = status === 'canceled'
      ? null
      : new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

    const updatedStudent = await userRepository.updateById(studentId, {
      subscriptionStatus: status,
      subscriptionPlan: plan,
      subscriptionRenewsAt: renewsAt,
    });

    await activityRepository.create({
      student: studentId,
      activityType: 'subscription_update',
      resourceType: 'subscription',
      metadata: {
        status,
        plan,
      },
    });

    return {
      status: updatedStudent.subscriptionStatus,
      plan: updatedStudent.subscriptionPlan,
      renewsAt: updatedStudent.subscriptionRenewsAt,
      isSubscribed: ['trial', 'active'].includes(updatedStudent.subscriptionStatus),
    };
  },

  async listFlashcards(studentId, courseId) {
    const progress = await progressRepository.findByStudent(studentId);
    const enrolledCourseIds = getPaidCourseIds(progress);
    if (!enrolledCourseIds.size) return [];

    if (courseId && !enrolledCourseIds.has(String(courseId))) return [];

    const cards = courseId
      ? await flashcardRepository.findByCourse(courseId)
      : await flashcardRepository.findAll();

    return filterByEnrolledCourse(cards, enrolledCourseIds, (item) => item?.course?._id || item?.course);
  },

  async listQuizzes(studentId) {
    const progress = await progressRepository.findByStudent(studentId);
    const enrolledCourseIds = getPaidCourseIds(progress);
    if (!enrolledCourseIds.size) return [];

    const quizzes = await quizRepository.findAll();
    return filterByEnrolledCourse(quizzes, enrolledCourseIds, (item) => item?.course?._id || item?.course);
  },

  async validateEnrolledResource(studentId, courseId, notEnrolledMessage) {
    const progress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (!progress) throw new Error(notEnrolledMessage);
    if (progress.paymentStatus !== 'paid') throw new Error('Payment required. Please complete course payment to access this content.');
    return true;
  },

  async trackFlashcardReview(studentId, flashcardId) {
    const card = await flashcardRepository.findById(flashcardId);
    if (!card) throw new Error('Flashcard not found');

    await studentService.validateEnrolledResource(studentId, card.course?._id || card.course, 'Please enroll in this course to review its flashcards');

    await activityRepository.create({
      student: studentId,
      activityType: 'flashcard_review',
      resourceType: 'flashcard',
      resourceId: flashcardId,
      metadata: { question: card.question, courseTitle: card.course?.title },
    });
    return { tracked: true };
  },

  async submitQuiz(studentId, quizId, answers) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    await studentService.validateEnrolledResource(studentId, quiz.course?._id || quiz.course, 'Please enroll in this course to attempt its quizzes');

    const priorAttempts = await quizAttemptRepository.findByStudent(studentId);
    const priorAttemptCountForQuiz = priorAttempts.filter((item) => String(item?.quiz?._id || item?.quiz) === String(quizId)).length;
    const trigger = priorAttemptCountForQuiz > 0 ? 'quiz_retake' : 'quiz_attempt';

    const submittedAnswers = Array.isArray(answers) ? answers : [];
    const normalizedAnswers = quiz.questions.map((question, index) => {
      const submitted = submittedAnswers[index];
      const parsed = Number.parseInt(submitted, 10);

      if (Number.isInteger(parsed) && parsed >= 0) {
        return parsed;
      }

      if (typeof submitted === 'string') {
        const submittedText = submitted.trim().toLowerCase();
        return question.options.findIndex((option) => String(option || '').trim().toLowerCase() === submittedText);
      }

      return -1;
    });

    const details = quiz.questions.map((question, index) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const submittedIndex = normalizedAnswers[index];
      const selectedAnswer = submittedIndex >= 0 ? options[submittedIndex] : null;
      const rawCorrectAnswer = question.correctAnswer;

      let correctAnswerIndexes = [];
      const parsedCorrect = Number.parseInt(rawCorrectAnswer, 10);

      if (Number.isInteger(parsedCorrect) && parsedCorrect >= 0) {
        correctAnswerIndexes = [parsedCorrect];
      } else if (typeof rawCorrectAnswer === 'string') {
        const expectedText = rawCorrectAnswer.trim().toLowerCase();
        correctAnswerIndexes = options
          .map((option, optionIndex) => ({ optionText: String(option || '').trim().toLowerCase(), optionIndex }))
          .filter((item) => item.optionText === expectedText)
          .map((item) => item.optionIndex);
      }

      const primaryCorrectIndex = correctAnswerIndexes.length ? correctAnswerIndexes[0] : -1;
      const isCorrect = correctAnswerIndexes.includes(submittedIndex);

      return {
        index,
        questionText: question.questionText,
        options,
        selectedAnswerIndex: submittedIndex,
        selectedAnswer,
        correctAnswerIndex: primaryCorrectIndex,
        correctAnswer: primaryCorrectIndex >= 0 ? options[primaryCorrectIndex] : null,
        isCorrect,
      };
    });

    const score = details.reduce((sum, item) => sum + (item.isCorrect ? 1 : 0), 0);

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = await quizAttemptRepository.create({
      student: studentId,
      quiz: quizId,
      answers: normalizedAnswers,
      score,
      totalQuestions,
      percentage,
    });

    const totalModules = quiz.course?.modules?.length || 10;
    const existingProgress = await progressRepository.findByStudentAndCourse(studentId, quiz.course._id);
    const previousCompletionPercent = Number(existingProgress?.completionPercent || 0);

    const updatedProgress = await progressRepository.upsert(studentId, quiz.course._id, {
      completedModules: Math.min(totalModules, Math.max(1, Math.round((percentage / 100) * totalModules))),
      totalModules,
      completionPercent: Math.min(100, percentage),
      lastAccessedAt: new Date(),
    });

    await activityRepository.create({
      student: studentId,
      activityType: 'quiz_submit',
      resourceType: 'quiz',
      resourceId: quizId,
      metadata: { percentage, title: quiz.title },
    });

    await safeGenerateRecommendation(studentId, {
      trigger,
      courseId: quiz.course?._id || quiz.course,
      courseTitle: quiz.course?.title,
      completionPercent: Number(updatedProgress?.completionPercent || 0),
    });

    if (previousCompletionPercent < 100 && Number(updatedProgress?.completionPercent || 0) >= 100) {
      await safeGenerateRecommendation(studentId, {
        trigger: 'course_complete',
        courseId: quiz.course?._id || quiz.course,
        courseTitle: quiz.course?.title,
        courseCompleted: true,
        completionPercent: Number(updatedProgress?.completionPercent || 0),
      });
    }

    return {
      ...attempt.toObject(),
      details,
    };
  },

  async analyzePdfDocument(studentId, file) {
    if (!file) throw new Error('PDF file is required');

    const [progress, documentCount] = await Promise.all([
      progressRepository.findByStudent(studentId),
      documentStudyPackRepository.countByStudent(studentId),
    ]);

    if ((progress || []).length === 0 && documentCount >= NON_ENROLLED_DOCUMENT_UPLOAD_LIMIT) {
      throw new Error(`You can upload up to ${NON_ENROLLED_DOCUMENT_UPLOAD_LIMIT} documents before enrolling in a course. Enroll in any course to upload more.`);
    }

    const parser = new PDFParse({ data: file.buffer });
    let parsed;

    try {
      parsed = await parser.getText();
    } finally {
      await parser.destroy();
    }

    const text = (parsed?.text || '').trim();
    if (!text) throw new Error('Could not extract text from PDF. Please upload a text-based PDF document.');

    const studyPack = await aiDocumentService.generateStudyPack(text, file.originalname || 'Document');

    await activityRepository.create({
      student: studentId,
      activityType: 'document_analyze',
      resourceType: 'document',
      metadata: {
        fileName: file.originalname,
        fileSize: file.size,
        source: studyPack.source,
      },
    });

    const savedStudyPack = await documentStudyPackRepository.create({
      student: studentId,
      fileName: file.originalname,
      fileSize: file.size,
      extractedCharacters: text.length,
      extractedText: text,
      summary: studyPack.summary,
      simplifiedExplanation: studyPack.simplifiedExplanation,
      keyPoints: studyPack.keyPoints,
      flashcards: studyPack.flashcards,
      quiz: studyPack.quiz,
      source: studyPack.source,
      attempts: [],
      chatHistory: [],
    });

    return {
      id: savedStudyPack._id,
      fileName: file.originalname,
      fileSize: file.size,
      maxUploadBytes: env.documentUploadMaxBytes,
      extractedCharacters: text.length,
      extractedText: text,
      summary: studyPack.summary,
      simplifiedExplanation: studyPack.simplifiedExplanation,
      keyPoints: studyPack.keyPoints,
      flashcards: studyPack.flashcards,
      quiz: studyPack.quiz,
      source: studyPack.source,
      attempts: savedStudyPack.attempts,
      chatHistory: savedStudyPack.chatHistory,
      createdAt: savedStudyPack.createdAt,
    };
  },

  async submitGeneratedQuiz(studentId, documentId, answers) {
    const document = await documentStudyPackRepository.findByIdAndStudent(documentId, studentId);
    if (!document) throw new Error('Document study pack not found');

    const questions = Array.isArray(document?.quiz?.questions) ? document.quiz.questions : [];
    const submittedAnswers = Array.isArray(answers) ? answers : [];

    if (!questions.length) throw new Error('Quiz questions are required');

    const results = questions.map((question, index) => {
      const options = Array.isArray(question?.options) ? question.options : [];
      const selectedAnswer = submittedAnswers[index] || '';
      const correctAnswer = question?.correctAnswer || '';
      const isCorrect = selectedAnswer === correctAnswer;

      return {
        index,
        questionText: question?.questionText || `Question ${index + 1}`,
        options,
        selectedAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    const score = results.reduce((sum, item) => sum + (item.isCorrect ? 1 : 0), 0);
    const totalQuestions = results.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

    const attemptData = {
      answers: submittedAnswers,
      score,
      totalQuestions,
      percentage,
      results,
      createdAt: new Date(),
    };

    const updatedDocument = await documentStudyPackRepository.appendAttempt(documentId, studentId, attemptData);
    if (!updatedDocument) throw new Error('Unable to save document quiz attempt');

    await activityRepository.create({
      student: studentId,
      activityType: 'document_quiz_submit',
      resourceType: 'document_quiz',
      resourceId: document._id,
      metadata: {
        fileName: document.fileName,
        score,
        totalQuestions,
        percentage,
      },
    });

    const latestAttempt = updatedDocument.attempts[updatedDocument.attempts.length - 1];

    return {
      score,
      totalQuestions,
      percentage,
      results,
      attempt: latestAttempt,
    };
  },

  async listDocumentHistory(studentId, searchTerm) {
    const docs = await documentStudyPackRepository.findByStudent(studentId, searchTerm);
    return docs.map((item) => {
      const attempts = Array.isArray(item.attempts) ? item.attempts : [];
      const latestAttempt = attempts.length ? attempts[attempts.length - 1] : null;

      return {
        _id: item._id,
        fileName: item.fileName,
        fileSize: item.fileSize,
        source: item.source,
        summary: item.summary,
        keyPointsCount: item.keyPoints.length,
        flashcardsCount: item.flashcards.length,
        quizQuestionsCount: item.quiz?.questions?.length || 0,
        attemptsCount: attempts.length,
        latestScore: latestAttempt ? latestAttempt.percentage : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  },

  async getDocumentById(studentId, documentId) {
    const document = await documentStudyPackRepository.findByIdAndStudent(documentId, studentId);
    if (!document) throw new Error('Document study pack not found');
    return document;
  },

  async deleteDocument(studentId, documentId) {
    const document = await documentStudyPackRepository.deleteByIdAndStudent(documentId, studentId);
    if (!document) throw new Error('Document not found');
    return { deleted: true };
  },

  async askDocumentQuestion(studentId, documentId, question) {
    const document = await documentStudyPackRepository.findByIdAndStudent(documentId, studentId);
    if (!document) throw new Error('Document study pack not found');

    const cleanQuestion = (question || '').trim();
    if (!cleanQuestion) throw new Error('Question is required');

    const chatResponse = await aiDocumentService.answerQuestion(document, cleanQuestion);

    const updated = await documentStudyPackRepository.appendChatMessage(documentId, studentId, {
      question: cleanQuestion,
      answer: chatResponse.answer,
      source: chatResponse.source,
      createdAt: new Date(),
    });

    const latest = updated?.chatHistory?.[updated.chatHistory.length - 1];
    return {
      message: latest,
      chatHistory: updated?.chatHistory || [],
    };
  },

  listAttempts: async (studentId) => quizAttemptRepository.findByStudent(studentId),
  listRecommendations: async (studentId) => recommendationRepository.findByStudent(studentId),

  async refreshRecommendations(studentId, context = {}) {
    const generated = await safeGenerateRecommendation(studentId, {
      trigger: context.trigger || 'manual_refresh',
    });

    if (!generated) {
      throw new Error('Unable to refresh recommendation at the moment');
    }

    return generated;
  },

  async getInstructorContent(studentId, filter = {}) {
    const progress = await progressRepository.findByStudent(studentId);
    const paidCategoryIds = new Set(
      progress
        .filter((item) => item?.paymentStatus === 'paid')
        .map((item) => String(item?.course?.category?._id || item?.course?.category || ''))
        .filter(Boolean)
    );

    if (!paidCategoryIds.size) return [];

    const query = {};
    if (filter.contentType) query.contentType = filter.contentType;
    const requestedCategory = String(filter.category || '');

    if (requestedCategory) {
      if (!paidCategoryIds.has(requestedCategory)) return [];
      query.category = requestedCategory;
    }

    const content = await instructorContentRepository.findAllPublished(query);
    return content.filter((item) => paidCategoryIds.has(String(item?.category?._id || item?.category || '')));
  },

  async generateStructuredContent(studentId, payload) {
    const { courseName, topic, skillLevel } = payload;
    if (!courseName?.trim() || !topic?.trim()) {
      throw new Error('Course name and learning topic are required');
    }

    const student = await userRepository.findStudentById(studentId);
    if (!student) throw new Error('Student not found');

    const skillLevelMap = {
      Beginner: 'beginner with no prior knowledge',
      Intermediate: 'intermediate learner with some foundational knowledge',
      Advanced: 'advanced learner seeking deep understanding and nuances',
    };

    const skillDescription = skillLevelMap[skillLevel] || skillLevelMap.Beginner;

    const prompt = `You are an expert educational content creator. Generate comprehensive, structured learning content for a ${skillDescription} about the following:

Course: ${courseName}
Topic: ${topic}

Please provide the response in the following JSON format (ensure valid JSON):
{
  "overview": "A 2-3 sentence overview of the topic tailored to the ${skillLevel} level",
  "keyConcepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5"],
  "learningApproach": "A paragraph describing the best approach for a ${skillLevel} learner to understand this topic, including specific study strategies and time recommendations",
  "practiceExercises": ["exercise 1", "exercise 2", "exercise 3", "exercise 4"],
  "misconceptions": ["common misconception 1 and correction", "common misconception 2 and correction", "common misconception 3 and correction"],
  "assessmentQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "furtherResources": ["resource 1 and why it matters", "resource 2 and why it matters", "resource 3 and why it matters"]
}

Ensure the content is:
- Appropriate for the ${skillLevel} skill level
- Practical and actionable
- Tailored specifically to: ${topic} in ${courseName}
- Free of jargon that the learner wouldn't understand at their level`;

    let content;
    try {
      const aiResponse = await aiDocumentService.callOpenAI(prompt);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format from AI');
      content = JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error(`Failed to generate content: ${err.message}`);
    }

    await activityRepository.create({
      student: studentId,
      activityType: 'generated_content',
      resourceType: 'learning_content',
      metadata: {
        courseName: courseName.trim(),
        topic: topic.trim(),
        skillLevel,
      },
    });

    return {
      courseName: courseName.trim(),
      topic: topic.trim(),
      skillLevel,
      overview: content.overview || '',
      keyConcepts: Array.isArray(content.keyConcepts) ? content.keyConcepts : [],
      learningApproach: content.learningApproach || '',
      practiceExercises: Array.isArray(content.practiceExercises) ? content.practiceExercises : [],
      misconceptions: Array.isArray(content.misconceptions) ? content.misconceptions : [],
      assessmentQuestions: Array.isArray(content.assessmentQuestions) ? content.assessmentQuestions : [],
      furtherResources: Array.isArray(content.furtherResources) ? content.furtherResources : [],
      generatedAt: new Date(),
    };
  },
};
