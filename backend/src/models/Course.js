import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, default: 20 },
  type: { type: String, enum: ['video', 'reading', 'exercise', 'project'], default: 'reading' },
  textContent: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  resourceUrl: { type: String, default: '' },
  resourceTitle: { type: String, default: '' },
}, { _id: false });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true },
  moderationStatus: { type: String, enum: ['visible', 'hidden', 'reported'], default: 'visible' },
  isHidden: { type: Boolean, default: false },
  reportReason: { type: String, default: '', trim: true },
  moderatedAt: { type: Date, default: null },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  price: { type: Number, default: 49.99, min: 0 },
  currency: { type: String, default: 'USD' },
  durationHours: { type: Number, default: 1 },
  thumbnail: { type: String, default: '' },
  modules: { type: [moduleSchema], default: [] },
  overviewNotes: { type: String, default: '' },
  announcements: { type: [announcementSchema], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
