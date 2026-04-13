import { categoryRepository } from '../repositories/categoryRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { quizRepository } from '../repositories/quizRepository.js';
import { quizAttemptRepository } from '../repositories/quizAttemptRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { flashcardRepository } from '../repositories/flashcardRepository.js';

export const adminService = {
  async getDashboard() {
    const [students, courses, quizzes, attempts, progress, flashcards, categories] = await Promise.all([
      userRepository.findStudents(),
      courseRepository.findAll(),
      quizRepository.findAll(),
      quizAttemptRepository.findAll(),
      progressRepository.findAll(),
      flashcardRepository.findAll(),
      categoryRepository.findAll(),
    ]);

    return {
      stats: {
        students: students.length,
        courses: courses.length,
        quizzes: quizzes.length,
        attempts: attempts.length,
        flashcards: flashcards.length,
        categories: categories.length,
      },
      recentAttempts: attempts.slice(0, 5),
      progress: progress.slice(0, 5),
    };
  },

  listStudents: () => userRepository.findStudents(),
  listInstructors: () => userRepository.findInstructors(),
  listAdmins: () => userRepository.findAdmins(),
  getProfile: (adminId) => userRepository.findById(adminId),

  async updateProfile(adminId, data) {
    const profile = await userRepository.updateById(adminId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      preferredSubject: data.preferredSubject,
      preferredLearningStyle: data.preferredLearningStyle,
      learningGoal: data.learningGoal,
      skillLevel: data.skillLevel,
      weeklyLearningGoalHours: data.weeklyLearningGoalHours,
    });
    if (!profile) throw new Error('Admin not found');
    return profile;
  },

  listCategories: () => categoryRepository.findAll(),

  async createCategory(data) {
    const existing = await categoryRepository.findByName(data.name);
    if (existing) throw new Error('Category already exists');
    return categoryRepository.create(data);
  },

  async updateCategory(id, data) {
    const category = await categoryRepository.updateById(id, { name: data.name, description: data.description });
    if (!category) throw new Error('Category not found');
    return category;
  },

  async deleteCategory(id) {
    const category = await categoryRepository.deleteById(id);
    if (!category) throw new Error('Category not found');
    return category;
  },

  async getStudentById(id) {
    const student = await userRepository.findStudentById(id);
    if (!student) throw new Error('Student not found');
    return student;
  },

  async updateStudent(id, data) {
    const student = await userRepository.updateById(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      skillLevel: data.skillLevel,
      preferredSubject: data.preferredSubject,
      preferredLearningStyle: data.preferredLearningStyle,
      learningGoal: data.learningGoal,
    });
    if (!student) throw new Error('Student not found');
    return student;
  },

  async deleteStudent(id) {
    const student = await userRepository.deleteById(id);
    if (!student) throw new Error('Student not found');
    return student;
  },

  async updateInstructor(id, data) {
    const instructor = await userRepository.findInstructorById(id);
    if (!instructor) throw new Error('Instructor not found');

    const allowedStatuses = ['pending', 'active', 'inactive'];
    const nextStatus = allowedStatuses.includes(data.status) ? data.status : instructor.status;

    return userRepository.updateById(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      skillLevel: data.skillLevel,
      preferredSubject: data.preferredSubject,
      preferredLearningStyle: data.preferredLearningStyle,
      learningGoal: data.learningGoal,
      status: nextStatus,
    });
  },

  async deleteInstructor(id) {
    const instructor = await userRepository.findInstructorById(id);
    if (!instructor) throw new Error('Instructor not found');
    return userRepository.deleteById(id);
  },

  createCourse: (adminId, data) => courseRepository.create({
    title: data.title,
    description: data.description,
    category: data.category,
    level: data.level,
    durationHours: data.durationHours,
    thumbnail: data.thumbnail || '',
    modules: data.modules || [],
    createdBy: adminId,
    isPublished: true,
  }),
  listCourses: () => courseRepository.findAll(),
  updateCourse: async (id, data) => {
    const course = await courseRepository.updateById(id, data);
    if (!course) throw new Error('Course not found');
    return course;
  },
  deleteCourse: async (id) => {
    const course = await courseRepository.deleteById(id);
    if (!course) throw new Error('Course not found');
    return course;
  },

  createQuiz: (adminId, data) => quizRepository.create({
    title: data.title,
    course: data.course,
    difficulty: data.difficulty,
    questions: data.questions,
    createdBy: adminId,
  }),
  listQuizzes: () => quizRepository.findAll(),
  updateQuiz: async (id, data) => {
    const quiz = await quizRepository.updateById(id, data);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  },
  deleteQuiz: async (id) => {
    const quiz = await quizRepository.deleteById(id);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  },

  createFlashcard: (adminId, data) => flashcardRepository.create({
    course: data.course,
    category: data.category,
    question: data.question,
    answer: data.answer,
    difficulty: data.difficulty,
    createdBy: adminId,
  }),
  listFlashcards: () => flashcardRepository.findAll(),
  updateFlashcard: async (id, data) => {
    const flashcard = await flashcardRepository.updateById(id, data);
    if (!flashcard) throw new Error('Flashcard not found');
    return flashcard;
  },
  deleteFlashcard: async (id) => {
    const flashcard = await flashcardRepository.deleteById(id);
    if (!flashcard) throw new Error('Flashcard not found');
    return flashcard;
  },

  async getCategoryAnalytics() {
    const [categories, courses, quizzes, flashcards, progress, attempts] = await Promise.all([
      categoryRepository.findAll(),
      courseRepository.findAll(),
      quizRepository.findAll(),
      flashcardRepository.findAll(),
      progressRepository.findAll(),
      quizAttemptRepository.findAll(),
    ]);

    return categories.map((category) => {
      const categoryCourses = courses.filter((course) => String(course.category?._id || course.category) === String(category._id));
      const categoryCourseIds = new Set(categoryCourses.map((course) => String(course._id)));
      const categoryQuizzes = quizzes.filter((quiz) => categoryCourseIds.has(String(quiz.course?._id || quiz.course)));
      const categoryFlashcards = flashcards.filter((flashcard) => String(flashcard.category?._id || flashcard.category) === String(category._id));
      const categoryProgress = progress.filter((item) => categoryCourseIds.has(String(item.course?._id || item.course)));
      const quizIds = new Set(categoryQuizzes.map((quiz) => String(quiz._id)));
      const categoryAttempts = attempts.filter((attempt) => quizIds.has(String(attempt.quiz?._id || attempt.quiz)));
      const avgCompletion = categoryProgress.length ? Math.round(categoryProgress.reduce((sum, item) => sum + (item.completionPercent || 0), 0) / categoryProgress.length) : 0;
      const avgQuizScore = categoryAttempts.length ? Math.round(categoryAttempts.reduce((sum, item) => sum + (item.percentage || 0), 0) / categoryAttempts.length) : 0;
      return {
        _id: category._id,
        name: category.name,
        description: category.description,
        courseCount: categoryCourses.length,
        quizCount: categoryQuizzes.length,
        flashcardCount: categoryFlashcards.length,
        avgCompletion,
        avgQuizScore,
      };
    });
  },
};
