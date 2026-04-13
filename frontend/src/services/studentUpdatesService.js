import { studentService } from './studentService';

export const STUDENT_UPDATES_LAST_SEEN_KEY = 'student_updates_last_seen_at';

export const formatUpdateTime = (value) => {
  if (!value) return 'Just now';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Just now';
  return parsed.toLocaleString();
};

export const getStudentUpdates = async () => {
  const [contentResponse, coursesResponse] = await Promise.all([
    studentService.getInstructorContent(),
    studentService.getCourses(),
  ]);

  const instructorUpdates = (contentResponse?.data || []).map((item) => ({
    id: `instructor-${item._id}`,
    source: 'Instructor',
    title: item.title || 'New learning content',
    message: item.contentType ? `Uploaded ${item.contentType}` : 'Uploaded new content',
    timestamp: new Date(item.updatedAt || item.createdAt || Date.now()).getTime(),
    rawDate: item.updatedAt || item.createdAt,
  }));

  const adminUpdates = (coursesResponse?.data || []).map((course) => ({
    id: `admin-${course._id}`,
    source: 'Admin',
    title: course.title || 'Course updated',
    message: 'Published or updated course',
    timestamp: new Date(course.updatedAt || course.createdAt || Date.now()).getTime(),
    rawDate: course.updatedAt || course.createdAt,
  }));

  return [...instructorUpdates, ...adminUpdates]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);
};

export const getLastSeenTimestamp = () => {
  const lastSeenRaw = localStorage.getItem(STUDENT_UPDATES_LAST_SEEN_KEY) || '0';
  const lastSeen = Number.parseInt(lastSeenRaw, 10);
  return Number.isFinite(lastSeen) ? lastSeen : 0;
};

export const setLastSeenNow = () => {
  localStorage.setItem(STUDENT_UPDATES_LAST_SEEN_KEY, String(Date.now()));
};
