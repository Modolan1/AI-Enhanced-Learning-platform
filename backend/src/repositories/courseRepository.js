import Course from '../models/Course.js';

export const courseRepository = {
  create: (data) => Course.create(data),
  findAll: () => Course.find().populate('category').sort({ createdAt: -1 }),
  findAllPublished: () => Course.find({ $or: [{ isPublished: true }, { isPublished: { $exists: false } }] }).populate('category').sort({ createdAt: -1 }),
  findById: (id) => Course.findById(id).populate('category'),
  updateById: (id, data) => Course.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('category'),
  deleteById: (id) => Course.findByIdAndDelete(id),
  countByCategory: () => Course.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
};
