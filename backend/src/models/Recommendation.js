import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  reason: { type: String, required: true },
  suggestedActions: { type: [String], default: [] },
  source: { type: String, enum: ['rule', 'ai'], default: 'rule' },
  createdBy: { type: String, default: 'system' },
}, { timestamps: true });

export default mongoose.model('Recommendation', recommendationSchema);
