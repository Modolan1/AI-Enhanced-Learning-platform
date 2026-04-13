import { userRepository } from '../repositories/userRepository.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { generateToken } from '../utils/generateToken.js';
import { hashPassword, verifyPassword } from '../utils/hashPassword.js';
import { validatePassword } from '../utils/validatePassword.js';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 30 * 60 * 1000;

export const authService = {
  listPublishedCourses: () => courseRepository.findAllPublished(),

  async register(data) {
    const existing = await userRepository.findByEmail(String(data.email));
    if (existing) throw new Error('User already exists');

    const passwordErrors = validatePassword(data.password);
    if (passwordErrors.length) throw new Error(passwordErrors.join(' '));

    const passwordHash = await hashPassword(data.password);
    const isInstructor = data.role === 'instructor';
    const user = await userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: isInstructor ? 'instructor' : 'student',
      status: isInstructor ? 'pending' : 'active',
      learningGoal: data.learningGoal || '',
      skillLevel: data.skillLevel || 'Beginner',
      preferredSubject: data.preferredSubject || '',
      preferredLearningStyle: data.preferredLearningStyle || '',
      weeklyLearningGoalHours: data.weeklyLearningGoalHours || 5,
    });

    if (isInstructor) {
      return {
        pendingApproval: true,
        message: 'Instructor registration submitted. Your account will be active after admin approval.',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      };
    }

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        skillLevel: user.skillLevel,
      },
      token: generateToken(user),
    };
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(String(email));
    if (!user) {
      const invalidError = new Error('Invalid email or password');
      invalidError.statusCode = 401;
      throw invalidError;
    }

    const now = Date.now();
    if (user.lockUntil && new Date(user.lockUntil).getTime() > now) {
      const lockError = new Error('Too many failed login attempts. Try again after 30 minutes.');
      lockError.statusCode = 429;
      throw lockError;
    }

    if (user.lockUntil && new Date(user.lockUntil).getTime() <= now) {
      await userRepository.updateById(user._id, { failedLoginAttempts: 0, lockUntil: null });
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      const failedAttempts = (Number(user.failedLoginAttempts) || 0) + 1;

      if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await userRepository.updateById(user._id, {
          failedLoginAttempts: 0,
          lockUntil: new Date(now + LOGIN_LOCKOUT_MS),
        });

        const lockError = new Error('Too many failed login attempts. Try again after 30 minutes.');
        lockError.statusCode = 429;
        throw lockError;
      }

      await userRepository.updateById(user._id, {
        failedLoginAttempts: failedAttempts,
        lockUntil: null,
      });

      const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - failedAttempts;
      const invalidError = new Error(
        failedAttempts >= 2 && failedAttempts <= 4
          ? `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before temporary lock.`
          : 'Invalid email or password'
      );
      invalidError.statusCode = 401;
      throw invalidError;
    }

    if ((Number(user.failedLoginAttempts) || 0) > 0 || user.lockUntil) {
      await userRepository.updateById(user._id, { failedLoginAttempts: 0, lockUntil: null });
    }

    if (user.role === 'instructor' && user.status !== 'active') {
      const pendingError = new Error('Instructor account is pending admin approval. Please wait for approval.');
      pendingError.statusCode = 403;
      throw pendingError;
    }

    if (user.role === 'student') {
      await activityRepository.create({
        student: user._id,
        activityType: 'login',
        resourceType: 'system',
        metadata: { note: 'User logged in' },
      });
    }

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        skillLevel: user.skillLevel,
      },
      token: generateToken(user),
    };
  },

  async createAdmin(creatingAdminId, data) {
    // Verify creating user is an admin
    const creatingAdmin = await userRepository.findById(creatingAdminId);
    if (!creatingAdmin || creatingAdmin.role !== 'admin') {
      throw new Error('Only admins can create other admins');
    }

    // Prevent self-creation by email
    if (String(creatingAdmin.email).toLowerCase() === String(data.email).toLowerCase()) {
      throw new Error('Cannot create yourself as an admin');
    }

    // Check existing email
    const existing = await userRepository.findByEmail(String(data.email));
    if (existing) throw new Error('User already exists');

    // Validate password
    const passwordErrors = validatePassword(data.password);
    if (passwordErrors.length) throw new Error(passwordErrors.join(' '));

    // Create admin with hashed password
    const passwordHash = await hashPassword(data.password);
    const newAdmin = await userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: 'admin',
      createdBy: creatingAdminId,
      learningGoal: '',
      skillLevel: 'Beginner',
      preferredSubject: '',
      preferredLearningStyle: '',
      weeklyLearningGoalHours: 0,
    });

    return {
      user: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    };
  },

  async updatePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new Error('User not found');

    // Verify old password
    const valid = await verifyPassword(String(oldPassword), user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length) throw new Error(passwordErrors.join(' '));

    // Update password
    const newHash = await hashPassword(newPassword);
    const updated = await userRepository.updateById(userId, { passwordHash: newHash });
    return { success: true, message: 'Password updated successfully' };
  },
};
