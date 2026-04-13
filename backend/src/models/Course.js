import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, default: 20 },
  type: { type: String, enum: ['video', 'reading', 'exercise', 'project'], default: 'reading' },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  durationHours: { type: Number, default: 1 },
  thumbnail: { type: String, default: '' },
  modules: { type: [moduleSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
