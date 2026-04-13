import OpenAI from 'openai';
import { env } from '../config/env.js';
import { recommendationRepository } from '../repositories/recommendationRepository.js';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

function buildFallback(student, summary) {
  const actions = [];
  if ((summary.avgQuizScore || 0) < 60) actions.push('Review recent quizzes and retake weak topics.');
  if ((summary.completedCourses || 0) === 0) actions.push('Start with beginner-level course content and set a weekly study routine.');
  if ((summary.flashcardReviews || 0) < Math.max(3, Math.round((summary.totalFlashcardsAvailable || 0) * 0.2))) actions.push('Use flashcards more often to improve recall and long-term retention.');
  if (student.preferredLearningStyle) actions.push(`Use ${student.preferredLearningStyle.toLowerCase()} study methods during revision.`);
  if (student.preferredSubject) actions.push(`Focus next on ${student.preferredSubject}.`);
  return {
    title: `Personalized plan for ${student.firstName}`,
    reason: `Built from your quiz performance, learning activity, and preferences in ${student.preferredSubject || 'your selected subjects'}.`,
    suggestedActions: actions.slice(0, 4),
    source: 'rule',
  };
}

export const aiRecommendationService = {
  async generateAndSave(student, summary) {
    let recommendation = buildFallback(student, summary);

    if (client && student.recommendationOptIn) {
      try {
        const prompt = `Return valid JSON with keys title, reason, suggestedActions. Student profile: ${JSON.stringify({
          skillLevel: student.skillLevel,
          preferredSubject: student.preferredSubject,
          preferredLearningStyle: student.preferredLearningStyle,
          learningGoal: student.learningGoal,
          weeklyLearningGoalHours: student.weeklyLearningGoalHours,
        })}. Study summary: ${JSON.stringify(summary)}. Keep recommendations practical for a capstone learning platform.`;

        const response = await client.responses.create({
          model: env.openaiModel,
          input: prompt,
        });

        const parsed = JSON.parse(response.output_text || '{}');
        if (parsed.title && parsed.reason) {
          recommendation = {
            title: parsed.title,
            reason: parsed.reason,
            suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
            source: 'ai',
          };
        }
      } catch (error) {
        console.warn('OpenAI recommendation fallback used:', error.message);
      }
    }

    return recommendationRepository.replaceLatestAi(student._id, {
      student: student._id,
      title: recommendation.title,
      reason: recommendation.reason,
      suggestedActions: recommendation.suggestedActions,
      source: recommendation.source,
      createdBy: recommendation.source === 'ai' ? 'openai' : 'rule-engine',
    });
  },
};
