import Progress from '../models/Progress.js';

export const progressRepository = {
  upsert: (student, course, data) => Progress.findOneAndUpdate(
    { student, course },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  ).populate('course'),
  findByStudent: (studentId) => Progress.find({ student: studentId }).populate({ path: 'course', populate: { path: 'category' } }).sort({ updatedAt: -1 }),
  findByStudentAndCourse: (studentId, courseId) => Progress.findOne({ student: studentId, course: courseId }).populate({ path: 'course', populate: { path: 'category' } }),
  findAll: () => Progress.find().populate('student', 'firstName lastName email').populate({ path: 'course', populate: { path: 'category' } }).sort({ updatedAt: -1 }),
};
