import API from './api';
export const adminService = {
  getDashboard: async () => (await API.get('/admin/dashboard')).data,
  getProfile: async () => (await API.get('/admin/profile')).data,
  updateProfile: async (payload) => (await API.put('/admin/profile', payload)).data,
  getStudents: async () => (await API.get('/admin/students')).data,
  getInstructors: async () => (await API.get('/admin/instructors')).data,
  getAdmins: async () => (await API.get('/admin/admins')).data,
  getStudentById: async (id) => (await API.get(`/admin/students/${id}`)).data,
  updateStudent: async (id, payload) => (await API.put(`/admin/students/${id}`, payload)).data,
  deleteStudent: async (id) => (await API.delete(`/admin/students/${id}`)).data,
  updateInstructor: async (id, payload) => (await API.put(`/admin/instructors/${id}`, payload)).data,
  deleteInstructor: async (id) => (await API.delete(`/admin/instructors/${id}`)).data,
  getCategories: async () => (await API.get('/admin/categories')).data,
  createCategory: async (payload) => (await API.post('/admin/categories', payload)).data,
  updateCategory: async (id, payload) => (await API.put(`/admin/categories/${id}`, payload)).data,
  deleteCategory: async (id) => (await API.delete(`/admin/categories/${id}`)).data,
  getCategoryAnalytics: async () => (await API.get('/admin/analytics/categories')).data,
  getCourses: async () => (await API.get('/admin/courses')).data,
  createCourse: async (payload) => (await API.post('/admin/courses', payload)).data,
  updateCourse: async (id, payload) => (await API.put(`/admin/courses/${id}`, payload)).data,
  deleteCourse: async (id) => (await API.delete(`/admin/courses/${id}`)).data,
  uploadCourseThumbnail: async (file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return (await API.post('/admin/courses/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data;
  },
  getQuizzes: async () => (await API.get('/admin/quizzes')).data,
  createQuiz: async (payload) => (await API.post('/admin/quizzes', payload)).data,
  updateQuiz: async (id, payload) => (await API.put(`/admin/quizzes/${id}`, payload)).data,
  deleteQuiz: async (id) => (await API.delete(`/admin/quizzes/${id}`)).data,
  getFlashcards: async () => (await API.get('/admin/flashcards')).data,
  createFlashcard: async (payload) => (await API.post('/admin/flashcards', payload)).data,
  updateFlashcard: async (id, payload) => (await API.put(`/admin/flashcards/${id}`, payload)).data,
  deleteFlashcard: async (id) => (await API.delete(`/admin/flashcards/${id}`)).data,
};
