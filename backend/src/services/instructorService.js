import { instructorContentRepository } from '../repositories/instructorContentRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';

export const instructorService = {
  getProfile: (instructorId) => userRepository.findById(instructorId),

  async updateProfile(instructorId, data) {
    const profile = await userRepository.updateById(instructorId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      preferredSubject: data.preferredSubject,
      preferredLearningStyle: data.preferredLearningStyle,
      learningGoal: data.learningGoal,
      skillLevel: data.skillLevel,
      weeklyLearningGoalHours: data.weeklyLearningGoalHours,
    });
    if (!profile) throw new Error('Instructor not found');
    return profile;
  },

  async getDashboard(instructorId) {
    const content = await instructorContentRepository.findByInstructor(instructorId);
    const videos = content.filter((c) => c.contentType === 'video');
    const documents = content.filter((c) => c.contentType === 'document');
    const totalViews = content.reduce((sum, c) => sum + c.viewCount, 0);

    return {
      stats: {
        totalContent: content.length,
        totalVideos: videos.length,
        totalDocuments: documents.length,
        totalViews,
      },
      recentContent: content.slice(0, 6),
    };
  },

  async listContent(instructorId) {
    return instructorContentRepository.findByInstructor(instructorId);
  },

  async getCategories() {
    return categoryRepository.findAll();
  },

  async createContent(instructorId, data, file) {
    const documentFile = Array.isArray(file?.file) ? file.file[0] : file;
    const videoFile = Array.isArray(file?.videoFile) ? file.videoFile[0] : null;

    if (!data.title || !data.contentType) {
      throw new Error('Title and content type are required');
    }

    if (data.contentType === 'video') {
      const videoSource = videoFile ? `/uploads/instructor-docs/${videoFile.filename}` : (data.videoUrl || '').trim();
      if (!videoSource) throw new Error('Video URL or uploaded video file is required');
      return instructorContentRepository.create({
        instructor: instructorId,
        title: data.title,
        description: data.description || '',
        contentType: 'video',
        videoUrl: videoSource,
        category: data.category || null,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPublished: data.isPublished !== 'false',
      });
    }

    if (data.contentType === 'document') {
      if (!documentFile) throw new Error('A document file is required');
      return instructorContentRepository.create({
        instructor: instructorId,
        title: data.title,
        description: data.description || '',
        contentType: 'document',
        fileUrl: `/uploads/instructor-docs/${documentFile.filename}`,
        originalFileName: documentFile.originalname,
        category: data.category || null,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPublished: data.isPublished !== 'false',
      });
    }

    throw new Error('Invalid content type');
  },

  async updateContent(instructorId, contentId, data, file) {
    const documentFile = Array.isArray(file?.file) ? file.file[0] : file;
    const videoFile = Array.isArray(file?.videoFile) ? file.videoFile[0] : null;

    const existing = await instructorContentRepository.findByInstructorAndId(instructorId, contentId);
    if (!existing) throw new Error('Content not found or access denied');

    const updates = {
      title: data.title || existing.title,
      description: data.description ?? existing.description,
      category: data.category || existing.category,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : existing.tags,
      isPublished: data.isPublished !== undefined ? data.isPublished !== 'false' : existing.isPublished,
    };

    if (existing.contentType === 'video') {
      if (videoFile) {
        updates.videoUrl = `/uploads/instructor-docs/${videoFile.filename}`;
      } else if (data.videoUrl) {
        updates.videoUrl = data.videoUrl;
      }
    }

    if (existing.contentType === 'document' && documentFile) {
      updates.fileUrl = `/uploads/instructor-docs/${documentFile.filename}`;
      updates.originalFileName = documentFile.originalname;
    }

    return instructorContentRepository.updateById(contentId, updates);
  },

  async deleteContent(instructorId, contentId) {
    const existing = await instructorContentRepository.findByInstructorAndId(instructorId, contentId);
    if (!existing) throw new Error('Content not found or access denied');
    await instructorContentRepository.deleteById(contentId);
    return { deleted: true };
  },

  async getContentById(instructorId, contentId) {
    const content = await instructorContentRepository.findByInstructorAndId(instructorId, contentId);
    if (!content) throw new Error('Content not found or access denied');
    return content;
  },

  async getPublishedContent(filter = {}) {
    const query = {};
    if (filter.contentType) query.contentType = filter.contentType;
    if (filter.category) query.category = filter.category;
    return instructorContentRepository.findAllPublished(query);
  },

  async getMyCourses(instructorId) {
    const allCourses = await courseRepository.findAll();
    const allEnrollments = await progressRepository.findAll();

    const instructorCourses = allCourses.filter(course => 
      course.createdBy?.toString() === instructorId || course.createdBy === instructorId
    );
    
    const coursesWithEnrollment = instructorCourses.map((course) => {
      const courseEnrollments = allEnrollments.filter(enrollment => 
        enrollment.course?._id?.toString() === course._id.toString() || 
        enrollment.course?._id === course._id
      );
      
      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        durationHours: course.durationHours,
        thumbnail: course.thumbnail,
        enrollmentCount: courseEnrollments.length,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    });

    return coursesWithEnrollment.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getStudentsEnrolled(instructorId) {
    const courses = await courseRepository.findAll();
    const instructorCourseIds = courses
      .filter(course => course.createdBy?.toString() === instructorId || course.createdBy === instructorId)
      .map(c => c._id);

    if (instructorCourseIds.length === 0) {
      return [];
    }

    const allEnrollments = await progressRepository.findAll();
    const instructorEnrollments = allEnrollments.filter(enrollment => 
      instructorCourseIds.some(courseId => enrollment.course?._id?.toString() === courseId.toString() || enrollment.course?._id === courseId)
    );

    return instructorEnrollments.map(enrollment => ({
      _id: enrollment._id,
      studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim(),
      studentEmail: enrollment.student?.email,
      courseTitle: enrollment.course?.title,
      enrollmentDate: enrollment.createdAt,
      completionPercent: enrollment.completionPercent,
      lastAccessedAt: enrollment.lastAccessedAt,
    })).sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
  },
};
