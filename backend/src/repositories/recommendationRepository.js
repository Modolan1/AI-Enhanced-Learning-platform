import Recommendation from '../models/Recommendation.js';

export const recommendationRepository = {
  create: (data) => Recommendation.create(data),
  findByStudent: (studentId) => Recommendation.find({ student: studentId }).sort({ createdAt: -1 }),
  replaceLatestAi: async (studentId, data) => {
    await Recommendation.deleteMany({ student: studentId, source: 'ai' });
    return Recommendation.create(data);
  },
};
