import Activity from '../models/Activity.js';

export const activityRepository = {
  create: (data) => Activity.create(data),
  findRecentByStudent: (studentId, limit=10) => Activity.find({ student: studentId }).sort({ createdAt: -1 }).limit(limit),
  findByStudent: (studentId) => Activity.find({ student: studentId }).sort({ createdAt: -1 }),
};
