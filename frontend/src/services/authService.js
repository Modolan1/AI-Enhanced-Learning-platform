import API from './api';
export const authService = {
  getPublishedCourses: async () => (await API.get('/public/courses')).data,
  login: async (payload) => (await API.post('/auth/login', payload)).data,
  register: async (payload) => (await API.post('/auth/register', payload)).data,
  registerInstructorApplication: async (payload) => (await API.post('/auth/register', { ...payload, role: 'instructor' })).data,
  createAdmin: async (payload) => (await API.post('/auth/admin/create', payload)).data,
  updatePassword: async (payload) => (await API.post('/auth/update-password', payload)).data,
};
