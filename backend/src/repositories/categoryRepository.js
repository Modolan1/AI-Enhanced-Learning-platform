import Category from '../models/Category.js';

export const categoryRepository = {
  create: (data) => Category.create(data),
  findAll: () => Category.find().sort({ name: 1 }),
  findByName: (name) => Category.findOne({ name: { $eq: String(name) } }),
  findById: (id) => Category.findById(id),
  updateById: (id, data) => Category.findByIdAndUpdate(id, data, { new: true }),
  deleteById: (id) => Category.findByIdAndDelete(id),
};
