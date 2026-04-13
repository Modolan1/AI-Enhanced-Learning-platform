import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedModules: { type: Number, default: 0 },
  totalModules: { type: Number, default: 10 },
  completionPercent: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

progressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
