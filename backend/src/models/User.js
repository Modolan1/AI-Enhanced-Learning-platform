import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: undefined },
  role: { type: String, enum: ['admin', 'student', 'instructor'], default: 'student' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestedCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  learningGoal: { type: String, default: '' },
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  preferredSubject: { type: String, default: '' },
  preferredLearningStyle: { type: String, default: '' },
  weeklyLearningGoalHours: { type: Number, default: 5 },
  subscriptionStatus: { type: String, enum: ['none', 'trial', 'active', 'canceled'], default: 'none' },
  subscriptionPlan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  subscriptionRenewsAt: { type: Date, default: null },
  recommendationOptIn: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'active' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string' } },
  }
);

export default mongoose.model('User', userSchema);
