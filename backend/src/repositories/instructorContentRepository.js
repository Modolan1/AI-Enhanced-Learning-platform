import InstructorContent from '../models/InstructorContent.js';

export const instructorContentRepository = {
  findByInstructor: (instructorId) =>
    InstructorContent.find({ instructor: instructorId })
      .populate('category', 'name')
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 }),

  findAllPublished: (filter = {}) => {
    const query = { isPublished: true, ...filter };
    return InstructorContent.find(query)
      .populate('category', 'name')
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 });
  },

  findPublishedByCategory: (categoryId) =>
    InstructorContent.find({ isPublished: true, category: categoryId })
      .populate('category', 'name')
      .populate('instructor', 'firstName lastName role')
      .sort({ createdAt: -1 }),

  findById: (id) =>
    InstructorContent.findById(id)
      .populate('category', 'name')
      .populate('instructor', 'firstName lastName'),

  findByInstructorAndId: (instructorId, id) =>
    InstructorContent.findOne({ _id: id, instructor: instructorId }),

  create: (data) => InstructorContent.create(data),

  updateById: (id, data) =>
    InstructorContent.findByIdAndUpdate(id, data, { new: true }),

  deleteById: (id) => InstructorContent.findByIdAndDelete(id),

  countByInstructor: (instructorId) =>
    InstructorContent.countDocuments({ instructor: instructorId }),

  incrementViewCount: (id) =>
    InstructorContent.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }),
};
