import mongoose from 'mongoose';

const instructorContentSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  contentType: { type: String, enum: ['video', 'document'], required: true },
  videoUrl: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  originalFileName: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('InstructorContent', instructorContentSchema);
