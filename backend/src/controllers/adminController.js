import { adminService } from '../services/adminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getDashboard() });
});

export const getCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listCategories() });
});

export const createCategory = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await adminService.createCategory(req.body) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateCategory(req.params.id, req.body) });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await adminService.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});

export const getCategoryAnalytics = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getCategoryAnalytics() });
});

export const getStudents = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listStudents() });
});

export const getInstructors = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listInstructors() });
});

export const getAdmins = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listAdmins() });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getProfile(req.user.userId) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateProfile(req.user.userId, req.body) });
});

export const getStudentById = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getStudentById(req.params.id) });
});

export const updateStudent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateStudent(req.params.id, req.body) });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await adminService.deleteStudent(req.params.id);
  res.json({ success: true, message: 'Student deleted' });
});

export const updateInstructor = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateInstructor(req.params.id, req.body) });
});

export const deleteInstructor = asyncHandler(async (req, res) => {
  await adminService.deleteInstructor(req.params.id);
  res.json({ success: true, message: 'Instructor deleted' });
});

export const createCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await adminService.createCourse(req.user.userId, req.body) });
});

export const getCourses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listCourses() });
});

export const updateCourse = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateCourse(req.params.id, req.body) });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  await adminService.deleteCourse(req.params.id);
  res.json({ success: true, message: 'Course deleted' });
});

export const getQuizzes = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listQuizzes() });
});

export const createQuiz = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await adminService.createQuiz(req.user.userId, req.body) });
});

export const updateQuiz = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateQuiz(req.params.id, req.body) });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  await adminService.deleteQuiz(req.params.id);
  res.json({ success: true, message: 'Quiz deleted' });
});

export const getFlashcards = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listFlashcards() });
});

export const createFlashcard = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await adminService.createFlashcard(req.user.userId, req.body) });
});

export const updateFlashcard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.updateFlashcard(req.params.id, req.body) });
});

export const deleteFlashcard = asyncHandler(async (req, res) => {
  await adminService.deleteFlashcard(req.params.id);
  res.json({ success: true, message: 'Flashcard deleted' });
});

export const uploadCourseThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/course-thumbnails/${req.file.filename}`;
  res.json({ success: true, data: { thumbnail: fileUrl, filename: req.file.filename } });
});
