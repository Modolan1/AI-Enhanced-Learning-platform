import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: { type: [String], default: [] },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
