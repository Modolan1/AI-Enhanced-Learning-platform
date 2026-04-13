import Quiz from '../models/Quiz.js';

export const quizRepository = {
  create: (data) => Quiz.create(data),
  findAll: () => Quiz.find().populate({ path: 'course', populate: { path: 'category' } }).sort({ createdAt: -1 }),
  findById: (id) => Quiz.findById(id).populate({ path: 'course', populate: { path: 'category' } }),
  findByCourse: (courseId) => Quiz.find({ course: courseId }).populate({ path: 'course', populate: { path: 'category' } }),
  updateById: (id, data) => Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate({ path: 'course', populate: { path: 'category' } }),
  deleteById: (id) => Quiz.findByIdAndDelete(id),
  countByCourse: () => Quiz.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
};
