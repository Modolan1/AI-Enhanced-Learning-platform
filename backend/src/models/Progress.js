import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  amountPaid: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  paymentProvider: { type: String, default: '' },
  paymentReference: { type: String, default: '' },
  paidAt: { type: Date, default: null },
  accessGrantedAt: { type: Date, default: null },
  completedModules: { type: Number, default: 0 },
  totalModules: { type: Number, default: 10 },
  completionPercent: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

progressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
