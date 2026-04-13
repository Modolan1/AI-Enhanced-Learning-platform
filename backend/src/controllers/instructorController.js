import { instructorService } from '../services/instructorService.js';
import { instructorContentRepository } from '../repositories/instructorContentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await instructorService.getDashboard(req.user.userId) });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await instructorService.getProfile(req.user.userId) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await instructorService.updateProfile(req.user.userId, req.body) });
});

export const getContent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await instructorService.listContent(req.user.userId) });
});

export const getCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await instructorService.getCategories() });
});

export const createContent = asyncHandler(async (req, res) => {
  const data = await instructorService.createContent(req.user.userId, req.body, req.files);
  res.status(201).json({ success: true, data });
});

export const updateContent = asyncHandler(async (req, res) => {
  const data = await instructorService.updateContent(req.user.userId, req.params.id, req.body, req.files);
  res.json({ success: true, data });
});

export const deleteContent = asyncHandler(async (req, res) => {
  const data = await instructorService.deleteContent(req.user.userId, req.params.id);
  res.json({ success: true, data });
});

export const getContentById = asyncHandler(async (req, res) => {
  const data = await instructorService.getContentById(req.user.userId, req.params.id);
  res.json({ success: true, data });
});

export const trackView = asyncHandler(async (req, res) => {
  await instructorContentRepository.incrementViewCount(req.params.id);
  res.json({ success: true });
});

export const getMyCourses = asyncHandler(async (req, res) => {
  const data = await instructorService.getMyCourses(req.user.userId);
  res.json({ success: true, data });
});

export const getStudentsEnrolled = asyncHandler(async (req, res) => {
  const data = await instructorService.getStudentsEnrolled(req.user.userId);
  res.json({ success: true, data });
});
