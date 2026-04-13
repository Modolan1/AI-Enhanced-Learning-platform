import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Flashcard', flashcardSchema);
