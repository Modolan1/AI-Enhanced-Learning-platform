import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student', 'instructor'], default: 'student' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  learningGoal: { type: String, default: '' },
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  preferredSubject: { type: String, default: '' },
  preferredLearningStyle: { type: String, default: '' },
  weeklyLearningGoalHours: { type: Number, default: 5 },
  recommendationOptIn: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'active' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
