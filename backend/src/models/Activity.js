import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: {
    type: String,
    enum: [
      'login',
      'course_view',
      'course_detail_view',
      'course_enrollment',
      'lesson_view',
      'lesson_complete',
      'lesson_reopen',
      'quiz_submit',
      'flashcard_review',
      'profile_update',
      'subscription_update',
      'course_payment',
      'document_analyze',
      'document_quiz_submit',
      'generated_content',
    ],
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['course', 'lesson', 'quiz', 'flashcard', 'profile', 'document', 'document_quiz', 'subscription', 'system', 'learning_content'],
    default: 'system',
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
