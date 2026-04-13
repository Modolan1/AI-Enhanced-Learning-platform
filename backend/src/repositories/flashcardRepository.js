import Flashcard from '../models/Flashcard.js';

export const flashcardRepository = {
  create: (data) => Flashcard.create(data),
  findAll: () => Flashcard.find().populate('course').populate('category').sort({ createdAt: -1 }),
  findById: (id) => Flashcard.findById(id).populate('course').populate('category'),
  findByCourse: (courseId) => Flashcard.find({ course: courseId }).populate('course').populate('category').sort({ createdAt: -1 }),
  updateById: (id, data) => Flashcard.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('course').populate('category'),
  deleteById: (id) => Flashcard.findByIdAndDelete(id),
  countByCategory: () => Flashcard.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
};
