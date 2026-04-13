import { connectDB } from './config/db.js';
import { hashPassword } from './utils/hashPassword.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Course from './models/Course.js';
import Quiz from './models/Quiz.js';
import Recommendation from './models/Recommendation.js';
import Progress from './models/Progress.js';
import QuizAttempt from './models/QuizAttempt.js';
import Activity from './models/Activity.js';
import Flashcard from './models/Flashcard.js';
import InstructorContent from './models/InstructorContent.js';

await connectDB();
await Promise.all([
  User.deleteMany({}), Category.deleteMany({}), Course.deleteMany({}), Quiz.deleteMany({}), Flashcard.deleteMany({}),
  Recommendation.deleteMany({}), Progress.deleteMany({}), QuizAttempt.deleteMany({}), Activity.deleteMany({}),
  InstructorContent.deleteMany({})
]);

const passwordHash = await hashPassword('');
const [admin, student, instructor] = await User.create([
  {
    firstName: 'Admin', lastName: 'User', email: '', passwordHash, role: 'admin',
    preferredSubject: 'Web Development', preferredLearningStyle: 'Visual', skillLevel: 'Advanced'
  },
  {
    firstName: 'Student', lastName: 'User', email: '', passwordHash, role: 'student',
    preferredSubject: 'Web Development', preferredLearningStyle: 'Visual', skillLevel: 'Beginner', learningGoal: 'Become a full-stack developer'
  },
  {
    firstName: 'Instructor', lastName: 'User', email: '', passwordHash, role: 'instructor',
    preferredSubject: 'Web Development', preferredLearningStyle: 'Project-based', skillLevel: 'Advanced'
  },
]);

const [webDev, math] = await Category.create([
  { name: 'Web Development', description: 'Frontend and backend web technologies' },
  { name: 'Math', description: 'Math learning paths and exercises' },
]);

const [course1, course2] = await Course.create([
  {
    title: 'React Fundamentals', description: 'Components, props, state, hooks', category: webDev._id,
    level: 'Beginner', durationHours: 12, createdBy: admin._id,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    modules: [
      { title: 'JSX and Components', durationMinutes: 35, type: 'reading' },
      { title: 'Props and Reusability', durationMinutes: 30, type: 'video' },
      { title: 'State and Events', durationMinutes: 40, type: 'exercise' },
      { title: 'Mini Project Dashboard', durationMinutes: 55, type: 'project' },
    ],
  },
  {
    title: 'Algebra Essentials', description: 'Variables, equations, expressions', category: math._id,
    level: 'Beginner', durationHours: 8, createdBy: admin._id,
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    modules: [
      { title: 'Working with Variables', durationMinutes: 25, type: 'reading' },
      { title: 'Linear Equations', durationMinutes: 45, type: 'exercise' },
      { title: 'Expressions and Simplification', durationMinutes: 35, type: 'video' },
    ],
  },
]);

const [quiz1, quiz2] = await Quiz.create([
  {
    title: 'React Basics Quiz', course: course1._id, difficulty: 'Easy', createdBy: admin._id,
    questions: [
      { questionText: 'Which hook stores local state?', options: ['useMemo', 'useState', 'useRef', 'useEffect'], correctAnswer: 'useState' },
      { questionText: 'JSX is...', options: ['A database', 'A syntax extension', 'A CSS library', 'A router'], correctAnswer: 'A syntax extension' },
    ],
  },
  {
    title: 'Algebra Starter Quiz', course: course2._id, difficulty: 'Easy', createdBy: admin._id,
    questions: [
      { questionText: 'Solve x + 3 = 7', options: ['2', '4', '7', '10'], correctAnswer: '4' },
      { questionText: 'What is 2x when x=5?', options: ['5', '7', '10', '12'], correctAnswer: '10' },
    ],
  },
]);

await Flashcard.create([
  {
    course: course1._id,
    category: webDev._id,
    question: 'What does useState return?',
    answer: 'An array with current state value and a setter function.',
    difficulty: 'Easy',
    createdBy: admin._id,
  },
  {
    course: course1._id,
    category: webDev._id,
    question: 'What are props in React?',
    answer: 'Inputs passed from parent to child components.',
    difficulty: 'Easy',
    createdBy: admin._id,
  },
  {
    course: course2._id,
    category: math._id,
    question: 'How do you isolate x in an equation?',
    answer: 'Apply inverse operations equally on both sides.',
    difficulty: 'Medium',
    createdBy: admin._id,
  },
]);

await Progress.create({
  student: student._id,
  course: course1._id,
  completedModules: 2,
  totalModules: 4,
  completionPercent: 50,
});

await QuizAttempt.create({
  student: student._id,
  quiz: quiz1._id,
  answers: ['useState', 'A syntax extension'],
  score: 2,
  totalQuestions: 2,
  percentage: 100,
});

await Activity.create([
  {
    student: student._id,
    activityType: 'course_view',
    resourceType: 'course',
    resourceId: course1._id,
    metadata: { title: course1.title },
  },
  {
    student: student._id,
    activityType: 'flashcard_review',
    resourceType: 'flashcard',
    metadata: { question: 'What are props in React?' },
  },
]);

await Recommendation.create({
  student: student._id,
  title: 'Continue with React State and Props',
  reason: 'You have started React Fundamentals, reviewed flashcards, and performed well on the quiz.',
  suggestedActions: ['Study component state', 'Practice props passing', 'Build a small dashboard', 'Review your React flashcards again'],
  source: 'rule',
  createdBy: 'seed',
});

await InstructorContent.create([
  {
    instructor: instructor._id,
    title: 'Intro to React Components (Video)',
    description: 'A quick instructor video covering components, props, and reusable UI patterns.',
    contentType: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    category: webDev._id,
    tags: ['react', 'components', 'frontend'],
    isPublished: true,
    viewCount: 14,
  },
  {
    instructor: instructor._id,
    title: 'React Study Notes (PDF)',
    description: 'Instructor-provided notes to reinforce fundamentals and revision points.',
    contentType: 'document',
    fileUrl: '/uploads/instructor-docs/sample-react-notes.pdf',
    originalFileName: 'sample-react-notes.pdf',
    category: webDev._id,
    tags: ['react', 'notes', 'revision'],
    isPublished: true,
    viewCount: 9,
  },
]);

console.log('Seed completed');
process.exit(0);
