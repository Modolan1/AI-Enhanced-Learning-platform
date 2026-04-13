import API from './api';

export const instructorService = {
  getDashboard: async () => (await API.get('/instructor/dashboard')).data,
  getProfile: async () => (await API.get('/instructor/profile')).data,
  updateProfile: async (payload) => (await API.put('/instructor/profile', payload)).data,
  getContent: async () => (await API.get('/instructor/content')).data,
  getCategories: async () => (await API.get('/instructor/categories')).data,
  getMyCourses: async () => (await API.get('/instructor/my-courses')).data,
  getStudentsEnrolled: async () => (await API.get('/instructor/students-enrolled')).data,
  createContent: async (formData) => (await API.post('/instructor/content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data,
  updateContent: async (id, formData) => (await API.put(`/instructor/content/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data,
  deleteContent: async (id) => (await API.delete(`/instructor/content/${id}`)).data,
};
