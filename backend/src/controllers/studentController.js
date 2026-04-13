import { studentService } from '../services/studentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.getDashboard(req.user.userId) });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.getProfile(req.user.userId) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.updateProfile(req.user.userId, req.body) });
});

export const getCourses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listCourses(req.user.userId) });
});

export const getCourseDetail = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.getCourseDetail(req.user.userId, req.params.id) });
});

export const enrollCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await studentService.enrollCourse(req.user.userId, req.params.id) });
});

export const getFlashcards = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listFlashcards(req.user.userId, req.query.courseId) });
});

export const trackFlashcardReview = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.trackFlashcardReview(req.user.userId, req.params.id) });
});

export const getQuizzes = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listQuizzes() });
});

export const submitQuiz = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.submitQuiz(req.user.userId, req.params.id, req.body.answers || []) });
});

export const getAttempts = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listAttempts(req.user.userId) });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listRecommendations(req.user.userId) });
});

export const refreshRecommendations = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.refreshRecommendations(req.user.userId) });
});

export const getDocumentUploadConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { maxUploadBytes: env.documentUploadMaxBytes } });
});

export const analyzeDocument = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.analyzePdfDocument(req.user.userId, req.file) });
});

export const submitGeneratedDocumentQuiz = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.submitGeneratedQuiz(req.user.userId, req.params.id, req.body.answers || []) });
});

export const getDocumentHistory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.listDocumentHistory(req.user.userId, req.query.search || '') });
});

export const getDocumentById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.getDocumentById(req.user.userId, req.params.id) });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.deleteDocument(req.user.userId, req.params.id) });
});

export const askDocumentQuestion = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await studentService.askDocumentQuestion(req.user.userId, req.params.id, req.body.question || '') });
});

export const getInstructorLearningContent = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await studentService.getInstructorContent({
      contentType: req.query.contentType,
      category: req.query.category,
    }),
  });
});
