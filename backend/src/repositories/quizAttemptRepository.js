import QuizAttempt from '../models/QuizAttempt.js';

export const quizAttemptRepository = {
  create: (data) => QuizAttempt.create(data),
  findByStudent: (studentId) => QuizAttempt.find({ student: studentId }).populate({ path: 'quiz', populate: { path: 'course' } }).sort({ createdAt: -1 }),
  findAll: () => QuizAttempt.find().populate('student', 'firstName lastName email').populate({ path: 'quiz', populate: { path: 'course' } }).sort({ createdAt: -1 }),
};
