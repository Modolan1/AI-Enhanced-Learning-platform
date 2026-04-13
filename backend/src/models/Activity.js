import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: {
    type: String,
    enum: ['login', 'course_view', 'course_detail_view', 'quiz_submit', 'flashcard_review', 'profile_update', 'document_analyze', 'document_quiz_submit'],
    required: true,
  },
  resourceType: { type: String, enum: ['course', 'quiz', 'flashcard', 'profile', 'document', 'document_quiz', 'system'], default: 'system' },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
