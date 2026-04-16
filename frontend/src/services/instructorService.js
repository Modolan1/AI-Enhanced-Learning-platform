import API from './api';

export const instructorService = {
  getDashboard: async () => (await API.get('/instructor/dashboard')).data,
  getProfile: async () => (await API.get('/instructor/profile')).data,
  updateProfile: async (payload) => (await API.put('/instructor/profile', payload)).data,
  getContent: async () => (await API.get('/instructor/content')).data,
  getCategories: async () => (await API.get('/instructor/categories')).data,
  getMyCourses: async () => (await API.get('/instructor/my-courses')).data,
  updateCourse: async (id, payload) => (await API.put(`/instructor/courses/${id}`, payload)).data,
  uploadCourseThumbnail: async (file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return (await API.post('/instructor/courses/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  getStudentsEnrolled: async () => (await API.get('/instructor/students-enrolled')).data,
  createContent: async (formData) => (await API.post('/instructor/content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data,
  updateContent: async (id, formData) => (await API.put(`/instructor/content/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data,
  uploadCourseModuleAsset: async (payload) => {
    const formData = new FormData();
    formData.append('courseId', payload.courseId);
    formData.append('moduleIndex', String(payload.moduleIndex));
    formData.append('assetType', payload.assetType);
    formData.append('resourceTitle', payload.resourceTitle || '');
    formData.append('file', payload.file);
    return (await API.post('/instructor/courses/upload/module-asset', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  deleteContent: async (id) => (await API.delete(`/instructor/content/${id}`)).data,
};
