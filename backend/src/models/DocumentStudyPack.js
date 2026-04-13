import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: { type: [quizQuestionSchema], default: [] },
}, { _id: false });

const quizResultSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: { type: [String], default: [] },
  selectedAnswer: { type: String, default: '' },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const documentAttemptSchema = new mongoose.Schema({
  answers: { type: [String], default: [] },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  results: { type: [quizResultSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  source: { type: String, enum: ['ai', 'rule'], default: 'rule' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const documentStudyPackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileSize: { type: Number, default: 0 },
  extractedCharacters: { type: Number, default: 0 },
  extractedText: { type: String, default: '' },
  summary: { type: String, required: true },
  simplifiedExplanation: { type: String, default: '' },
  keyPoints: { type: [String], default: [] },
  flashcards: { type: [flashcardSchema], default: [] },
  quiz: { type: quizSchema, required: true },
  source: { type: String, enum: ['ai', 'rule'], default: 'rule' },
  attempts: { type: [documentAttemptSchema], default: [] },
  chatHistory: { type: [chatMessageSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('DocumentStudyPack', documentStudyPackSchema);
