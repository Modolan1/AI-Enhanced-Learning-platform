import DocumentStudyPack from '../models/DocumentStudyPack.js';

/** Escapes special regex characters to prevent ReDoS from user-supplied search terms */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const documentStudyPackRepository = {
  create: (data) => DocumentStudyPack.create(data),

  findByStudent(studentId, searchTerm = '') {
    const query = { student: studentId };
    const trimmed = (searchTerm || '').trim();

    if (trimmed) {
      const safe = escapeRegex(trimmed);
      query.$or = [
        { fileName: { $regex: safe, $options: 'i' } },
        { summary: { $regex: safe, $options: 'i' } },
        { keyPoints: { $elemMatch: { $regex: safe, $options: 'i' } } },
      ];
    }

    return DocumentStudyPack.find(query).sort({ createdAt: -1 });
  },

  findByIdAndStudent(id, studentId) {
    return DocumentStudyPack.findOne({ _id: id, student: studentId });
  },

  appendAttempt(id, studentId, attempt) {
    return DocumentStudyPack.findOneAndUpdate(
      { _id: id, student: studentId },
      { $push: { attempts: attempt } },
      { new: true }
    );
  },

  appendChatMessage(id, studentId, message) {
    return DocumentStudyPack.findOneAndUpdate(
      { _id: id, student: studentId },
      { $push: { chatHistory: message } },
      { new: true }
    );
  },

  countByStudent(studentId) {
    return DocumentStudyPack.countDocuments({ student: studentId });
  },

  deleteByIdAndStudent(id, studentId) {
    return DocumentStudyPack.findOneAndDelete({ _id: id, student: studentId });
  },
};
