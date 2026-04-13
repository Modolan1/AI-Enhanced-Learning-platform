import User from '../models/User.js';

export const userRepository = {
  create: (data) => User.create(data),
  findByEmail: (email) => User.findOne({ email: { $eq: String(email) } }),
  findById: (id) => User.findById(id).select('-passwordHash'),
  findByIdWithPassword: (id) => User.findById(id),
  findStudentById: (id) => User.findOne({ _id: id, role: 'student' }).select('-passwordHash'),
  findInstructorById: (id) => User.findOne({ _id: id, role: 'instructor' }).select('-passwordHash'),
  findStudents: () => User.find({ role: 'student' }).select('-passwordHash').sort({ createdAt: -1 }),
  findInstructors: () => User.find({ role: 'instructor' }).select('-passwordHash').sort({ createdAt: -1 }),
  findAdmins: () => User.find({ role: 'admin' }).select('-passwordHash').populate('createdBy', 'firstName lastName email').sort({ createdAt: -1 }),
  updateById: (id, data) => User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-passwordHash'),
  deleteById: (id) => User.findByIdAndDelete(id),
};
