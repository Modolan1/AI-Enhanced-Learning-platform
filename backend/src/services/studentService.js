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
import { env } from '../config/env.js';
import { PDFParse } from 'pdf-parse';

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
    const [student, courses, attempts, progress, recommendations, recentActivity, flashcards, documentCount] = await Promise.all([
      userRepository.findStudentById(studentId),
      courseRepository.findAll(),
      quizAttemptRepository.findByStudent(studentId),
      progressRepository.findByStudent(studentId),
      recommendationRepository.findByStudent(studentId),
      activityRepository.findRecentByStudent(studentId, 8),
      flashcardRepository.findAll(),
      documentStudyPackRepository.countByStudent(studentId),
    ]);

    const avgQuizScore = attempts.length
      ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length)
      : 0;

    return {
      student,
      stats: {
        availableCourses: courses.length,
        completedModules: progress.reduce((sum, item) => sum + item.completedModules, 0),
        avgQuizScore,
        recommendations: recommendations.length,
        flashcards: flashcards.length,
        documents: documentCount,
      },
      courses: courses.slice(0, 6),
      progress,
      attempts: attempts.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
      recentActivity,
      topCategories: courses.reduce((acc, course) => {
        const name = course.category?.name || 'General';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {}),
    };
  },

  async listCourses(studentId) {
    const courses = await courseRepository.findAllPublished();
    await Promise.all(courses.slice(0, 1).map((course) =>
      activityRepository.create({
        student: studentId,
        activityType: 'course_view',
        resourceType: 'course',
        resourceId: course._id,
        metadata: { title: course.title },
      })
    ));
    return courses;
  },

  async getCourseDetail(studentId, courseId) {
    const [course, quizzes, flashcards, progress] = await Promise.all([
      courseRepository.findById(courseId),
      quizRepository.findByCourse(courseId),
      flashcardRepository.findByCourse(courseId),
      progressRepository.findByStudentAndCourse(studentId, courseId),
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

    return {
      course,
      quizzes,
      flashcards,
      learningContent,
      progress: progress || {
        completedModules: 0,
        totalModules: course.modules?.length || 0,
        completionPercent: 0,
      },
    };
  },

  async enrollCourse(studentId, courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const existingProgress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (existingProgress) {
      return existingProgress;
    }

    const newProgress = await progressRepository.upsert(studentId, courseId, {
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

    return newProgress;
  },

  async listFlashcards(studentId, courseId) {
    const cards = courseId ? await flashcardRepository.findByCourse(courseId) : await flashcardRepository.findAll();
    return cards;
  },

  async trackFlashcardReview(studentId, flashcardId) {
    const card = await flashcardRepository.findById(flashcardId);
    if (!card) throw new Error('Flashcard not found');
    await activityRepository.create({
      student: studentId,
      activityType: 'flashcard_review',
      resourceType: 'flashcard',
      resourceId: flashcardId,
      metadata: { question: card.question, courseTitle: card.course?.title },
    });
    return { tracked: true };
  },

  async analyzePdfDocument(studentId, file) {
    if (!file) throw new Error('PDF file is required');

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

  listQuizzes: async () => quizRepository.findAll(),
  listAttempts: async (studentId) => quizAttemptRepository.findByStudent(studentId),
  listRecommendations: async (studentId) => recommendationRepository.findByStudent(studentId),

  async submitQuiz(studentId, quizId, answers) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) score += 1;
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = await quizAttemptRepository.create({
      student: studentId,
      quiz: quizId,
      answers,
      score,
      totalQuestions,
      percentage,
    });

    const totalModules = quiz.course?.modules?.length || 10;
    await progressRepository.upsert(studentId, quiz.course._id, {
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

    return attempt;
  },

  async refreshRecommendations(studentId) {
    const student = await userRepository.findStudentById(studentId);
    if (!student) throw new Error('Student not found');

    const [attempts, progress, activities, flashcards] = await Promise.all([
      quizAttemptRepository.findByStudent(studentId),
      progressRepository.findByStudent(studentId),
      activityRepository.findByStudent(studentId),
      flashcardRepository.findAll(),
    ]);

    const summary = {
      avgQuizScore: attempts.length ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) : 0,
      totalQuizAttempts: attempts.length,
      completedCourses: progress.filter((item) => item.completionPercent >= 100).length,
      inProgressCourses: progress.filter((item) => item.completionPercent > 0 && item.completionPercent < 100).length,
      flashcardReviews: activities.filter((item) => item.activityType === 'flashcard_review').length,
      totalFlashcardsAvailable: flashcards.length,
      preferredSubject: student.preferredSubject,
      preferredLearningStyle: student.preferredLearningStyle,
      learningGoal: student.learningGoal,
    };

    return aiRecommendationService.generateAndSave(student, summary);
  },

  async getInstructorContent(filter = {}) {
    const query = {};
    if (filter.contentType) query.contentType = filter.contentType;
    if (filter.category) query.category = filter.category;
    return instructorContentRepository.findAllPublished(query);
  },
};
