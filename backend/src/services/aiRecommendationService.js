import OpenAI from 'openai';
import { env } from '../config/env.js';
import { recommendationRepository } from '../repositories/recommendationRepository.js';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

const TRIGGER_LABELS = {
  student_register: 'registration',
  first_course_enrollment: 'first enrollment',
  lesson_complete: 'lesson completion',
  quiz_attempt: 'quiz attempt',
  quiz_retake: 'quiz retake',
  course_complete: 'course completion',
  weekly_progress_review: 'weekly progress review',
  manual_refresh: 'manual refresh',
};

function getStudentPhase(summary = {}) {
  const completedCourses = summary.completedCourses || 0;
  const quizAttempts = summary.quizAttempts || summary.totalQuizAttempts || 0;

  if (completedCourses === 0 && quizAttempts === 0) return 'new_student';
  if (completedCourses === 0 && quizAttempts > 0) return 'early_active';
  if (completedCourses > 0) return 'progressed';
  return 'general';
}

function getSkillLevelProfile(skillLevel = 'Beginner') {
  const level = String(skillLevel || 'Beginner').toLowerCase();

  if (level === 'advanced') {
    return {
      syntheticScore: 76,
      title: 'Strategic Start Plan',
      reason: 'You selected an advanced level, so your starter recommendation assumes strong baseline confidence and focuses on challenge depth from day one.',
      actions: [
        'Begin with a challenge-first module and complete one practical exercise today.',
        'Take the first quiz quickly, then target only missed concepts for review.',
      ],
    };
  }

  if (level === 'intermediate') {
    return {
      syntheticScore: 64,
      title: 'Balanced Start Plan',
      reason: 'You selected an intermediate level, so your starter recommendation balances revision and forward progress to avoid gaps.',
      actions: [
        'Start the foundation module and complete at least one checkpoint activity.',
        'Attempt the first quiz after finishing the first lesson to validate understanding.',
      ],
    };
  }

  return {
    syntheticScore: 52,
    title: 'Foundation Start Plan',
    reason: 'You selected a beginner level, so your starter recommendation prioritizes confidence-building and fundamentals before speed.',
    actions: [
      'Begin with the introductory lesson and focus on key terms and examples.',
      'Delay quizzes until you complete your first lesson and summary notes.',
    ],
  };
}

function getStarterCourse(student) {
  const subject = (student.preferredSubject || '').toLowerCase();
  const level = (student.skillLevel || 'beginner').toLowerCase();

  const starterMap = {
    web: {
      beginner: 'HTML & CSS Fundamentals',
      intermediate: 'JavaScript Essentials',
    },
    programming: {
      beginner: 'Programming Basics',
      intermediate: 'Object-Oriented Programming',
    },
    data: {
      beginner: 'Python Basics',
      intermediate: 'Data Analysis Foundations',
    },
  };

  if (subject.includes('web')) return starterMap.web[level] || starterMap.web.beginner;
  if (subject.includes('program')) return starterMap.programming[level] || starterMap.programming.beginner;
  if (subject.includes('data')) return starterMap.data[level] || starterMap.data.beginner;

  return level === 'intermediate' ? 'Intermediate Learning Path' : 'Beginner Learning Path';
}

function getPerformanceBand(score = 0) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'weak';
  return 'at_risk';
}

function isWebDevelopmentSubject(summary = {}, student = {}) {
  const subject = String(summary.preferredSubject || student.preferredSubject || '').toLowerCase();
  const goal = String(summary.learningGoal || student.learningGoal || '').toLowerCase();
  return subject.includes('web') || goal.includes('web');
}

const WEB_DEV_PATH = [
  'HTML and CSS Fundamentals',
  'JavaScript Essentials',
  'React Fundamentals',
  'Node.js and Express.js Fundamentals',
];

function buildLearningPathMeta({ currentCourse = null, nextCourse = null, status = null } = {}) {
  return {
    trackKey: 'web-development',
    trackLabel: 'Web Development Path',
    currentCourse,
    nextCourse,
    status,
  };
}

function getWebPathIndex(courseTitle = '') {
  const title = String(courseTitle || '').toLowerCase();
  if (!title) return -1;

  if ((title.includes('html') || title.includes('css')) && title.includes('fundamental')) return 0;
  if (title.includes('javascript')) return 1;
  if (title.includes('react')) return 2;
  if ((title.includes('node') || title.includes('node.js')) && title.includes('express')) return 3;

  return -1;
}

function buildWebDevelopmentPathRecommendation(student, summary = {}, context = {}) {
  const trigger = context.trigger || 'manual_refresh';
  const triggerLabel = TRIGGER_LABELS[trigger] || 'learning update';
  const score = Number(summary.lastCompletedCourse?.score ?? summary.avgQuizScore ?? 0);
  const band = getPerformanceBand(score);
  const completedCourseTitle = summary.lastCompletedCourse?.title || context.courseTitle || '';
  const currentIndex = getWebPathIndex(completedCourseTitle);
  const currentCourse = currentIndex >= 0 ? WEB_DEV_PATH[currentIndex] : WEB_DEV_PATH[0];
  const nextCourse = currentIndex >= 0 && currentIndex < WEB_DEV_PATH.length - 1
    ? WEB_DEV_PATH[currentIndex + 1]
    : null;

  if (!summary.completedCourses && trigger === 'manual_refresh') {
    return {
      title: `Web Development Path: Start with ${WEB_DEV_PATH[0]}`,
      reason: `Your current profile suggests a web development track. Start from strong fundamentals before moving to advanced frameworks.` ,
      suggestedActions: [
        `Enroll in ${WEB_DEV_PATH[0]}.`,
        'Complete all modules and take each quiz carefully.',
        'Target 80% or above in quizzes before moving to JavaScript.',
      ],
      learningPath: buildLearningPathMeta({
        currentCourse: WEB_DEV_PATH[0],
        nextCourse: WEB_DEV_PATH[1],
        status: 'ready_to_enroll',
      }),
      source: 'rule',
      decision: { phase: 'web_path', type: 'web_start', track: 'web-development', trigger },
    };
  }

  if (band === 'strong') {
    if (!nextCourse) {
      return {
        title: `Excellent work, ${student.firstName} — you completed the full web path`,
        reason: `During this ${triggerLabel}, your strong score (${score}%) confirms mastery for the current stage in your web development learning journey.`,
        suggestedActions: [
          `Great job on ${currentCourse}.`,
          'Build one portfolio project combining HTML/CSS, JavaScript, React, and Node/Express.',
          'Start interview-style practice and advanced project deployment topics.',
        ],
        learningPath: buildLearningPathMeta({
          currentCourse,
          nextCourse: null,
          status: 'path_completed',
        }),
        source: 'rule',
        decision: { phase: 'web_path', type: 'web_path_completed', track: 'web-development', trigger },
      };
    }

    return {
      title: `Excellent work, ${student.firstName} — you are ready for ${nextCourse}`,
      reason: `During this ${triggerLabel}, your score (${score}%) is above 80%, so you are ready to progress to the next web development course.`,
      suggestedActions: [
        `Great job completing ${currentCourse}.`,
        `Enroll in ${nextCourse}.`,
        'In the new course, complete one module and one quiz in your first study session.',
      ],
      learningPath: buildLearningPathMeta({
        currentCourse: nextCourse,
        nextCourse,
        status: 'ready_to_enroll',
      }),
      source: 'rule',
      decision: { phase: 'web_path', type: 'web_advance', track: 'web-development', nextCourse, trigger },
    };
  }

  return {
    title: `Review ${currentCourse} before moving forward`,
    reason: `Your current performance (${score}%) is below the 80% progression target for the web development path. Strengthen your understanding first, then continue.`,
    suggestedActions: [
      `Revisit the lessons in ${currentCourse}.`,
      'Retake quizzes and target at least 80% score.',
      `After improving performance, proceed to ${nextCourse || 'the next advanced topic'}.`,
    ],
    learningPath: buildLearningPathMeta({
      currentCourse,
      nextCourse,
      status: 'review_required',
    }),
    source: 'rule',
    decision: { phase: 'web_path', type: 'web_review_before_advance', track: 'web-development', nextCourse, trigger },
  };
}

function getNextCourse(student, summary) {
  return summary.recommendedNextCourse || `Next ${student.preferredSubject || 'core'} course`;
}

function buildRuleRecommendation(student, summary = {}, context = {}) {
  if (isWebDevelopmentSubject(summary, student)) {
    return buildWebDevelopmentPathRecommendation(student, summary, context);
  }

  const phase = getStudentPhase(summary);
  const trigger = context.trigger || 'manual_refresh';
  const triggerLabel = TRIGGER_LABELS[trigger] || 'learning update';

  if (phase === 'new_student') {
    const starterCourse = getStarterCourse(student);
    const skillProfile = getSkillLevelProfile(student.skillLevel);

    return {
      title: `${skillProfile.title}: ${student.firstName}, here is your next move`,
      reason: `${skillProfile.reason} During this ${triggerLabel}, we are using a starter benchmark of ${skillProfile.syntheticScore}/100 to guide your first steps in ${student.preferredSubject || 'your subject'}.`,
      suggestedActions: [
        `Start with ${starterCourse}.`,
        ...skillProfile.actions,
        `Study for ${student.weeklyLearningGoalHours || 3} hour(s) this week.`,
        student.preferredLearningStyle
          ? `Use ${student.preferredLearningStyle.toLowerCase()} study methods while learning.`
          : 'Take short notes while studying to improve recall.',
      ],
      source: 'rule',
      decision: {
        phase,
        type: 'start',
        starterCourse,
        trigger,
        syntheticScore: skillProfile.syntheticScore,
      },
    };
  }

  if (phase === 'early_active') {
    const nextLesson = summary.recommendedNextLesson || 'the next lesson in your current course';
    const weakTopics = summary.weakTopics || [];
    const band = getPerformanceBand(summary.avgQuizScore || 0);

    if (band === 'weak' || band === 'at_risk') {
      return {
        title: `Focus on revision before moving ahead`,
        reason: `Your early quiz performance suggests that you should strengthen key topics first to build a better foundation.`,
        suggestedActions: [
          `Review ${weakTopics.slice(0, 2).join(' and ') || 'your weakest topics'}.`,
          `Retake your recent quiz after revision.`,
          `Then continue with ${nextLesson}.`,
        ],
        source: 'rule',
        decision: { phase, type: 'revise_then_continue', trigger },
      };
    }

    return {
      title: `You’re ready for the next step`,
      reason: `Your recent activity shows you are building momentum and can continue while reviewing a few weak areas.`,
      suggestedActions: [
        `Continue with ${nextLesson}.`,
        weakTopics.length ? `Review ${weakTopics.slice(0, 2).join(' and ')}.` : 'Review your recent quiz mistakes.',
        'Attempt the next quiz when you feel confident.',
      ],
      source: 'rule',
      decision: { phase, type: 'continue', trigger },
    };
  }

  if (phase === 'progressed') {
    const lastCourseTitle = summary.lastCompletedCourse?.title || 'your recent course';
    const score = summary.lastCompletedCourse?.score ?? summary.avgQuizScore ?? 0;
    const band = getPerformanceBand(score);
    const nextCourse = getNextCourse(student, summary);

    if (band === 'strong') {
      return {
        title: `Excellent progress — move to the next course`,
        reason: `You performed well in ${lastCourseTitle}, which means you are ready to advance to a more challenging topic.`,
        suggestedActions: [
          `Start ${nextCourse}.`,
          'Review your key notes from the completed course once this week.',
          'Attempt the first quiz in the new course early to confirm understanding.',
        ],
        source: 'rule',
        decision: { phase, type: 'advance', nextCourse, trigger },
      };
    }

    if (band === 'moderate') {
      return {
        title: `Good progress — revise before advancing`,
        reason: `You completed ${lastCourseTitle}, but reviewing weaker areas first will make the next course easier and more effective.`,
        suggestedActions: [
          `Review weak topics from ${lastCourseTitle}.`,
          `Then begin ${nextCourse}.`,
          'Retake any low-scoring quiz if available.',
        ],
        source: 'rule',
        decision: { phase, type: 'revise_then_advance', nextCourse, trigger },
      };
    }

    return {
      title: `Review this course before moving on`,
      reason: `Your performance in ${lastCourseTitle} suggests that you need a stronger foundation before taking the next course.`,
      suggestedActions: [
        `Repeat the most difficult lessons in ${lastCourseTitle}.`,
        'Review your weak quiz topics.',
        'Retake the course assessment before advancing.',
      ],
      source: 'rule',
      decision: { phase, type: 'repeat_or_review', trigger },
    };
  }

  return {
    title: `Personalized plan for ${student.firstName}`,
    reason: `Built from your learning activity and preferences.`,
    suggestedActions: [
      'Continue your current learning plan.',
      'Review your recent quiz results.',
      'Stay consistent with your weekly study target.',
    ],
    source: 'rule',
    decision: { phase: 'general', type: 'general', trigger },
  };
}

function sanitizeRecommendation(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback;

  const title = typeof parsed.title === 'string' && parsed.title.trim()
    ? parsed.title.trim()
    : fallback.title;

  const reason = typeof parsed.reason === 'string' && parsed.reason.trim()
    ? parsed.reason.trim()
    : fallback.reason;

  const suggestedActions = Array.isArray(parsed.suggestedActions)
    ? parsed.suggestedActions.filter((item) => typeof item === 'string' && item.trim()).slice(0, 4)
    : fallback.suggestedActions;

  return {
    ...fallback,
    title,
    reason,
    suggestedActions,
    learningPath: fallback.learningPath || null,
    source: 'ai',
  };
}

function buildAiPrompt(student, summary, ruleRecommendation, context = {}) {
  return `
Return JSON only with keys: title, reason, suggestedActions.

Keep the recommendation:
- specific
- short
- supportive
- based only on the provided data
- practical for a student learning platform

Do not invent new courses unless they are already implied by the rule recommendation.

Current trigger:
${JSON.stringify({
  trigger: context.trigger || 'manual_refresh',
  triggerLabel: TRIGGER_LABELS[context.trigger] || 'manual refresh',
  courseTitle: context.courseTitle,
  lessonTitle: context.lessonTitle,
  completionPercent: context.completionPercent,
})}

Student profile:
${JSON.stringify({
  firstName: student.firstName,
  skillLevel: student.skillLevel,
  preferredSubject: student.preferredSubject,
  preferredLearningStyle: student.preferredLearningStyle,
  learningGoal: student.learningGoal,
  weeklyLearningGoalHours: student.weeklyLearningGoalHours,
})}

Study summary:
${JSON.stringify(summary)}

Rule recommendation:
${JSON.stringify({
  title: ruleRecommendation.title,
  reason: ruleRecommendation.reason,
  suggestedActions: ruleRecommendation.suggestedActions,
  decision: ruleRecommendation.decision,
})}
`;
}

export const aiRecommendationService = {
  async generateAndSave(student, summary, context = {}) {
    let recommendation = buildRuleRecommendation(student, summary, context);

    const isDeterministicWebPath = recommendation?.decision?.track === 'web-development';

    if (client && student.recommendationOptIn && !isDeterministicWebPath) {
      try {
        const response = await client.responses.create({
          model: env.openaiModel,
          input: buildAiPrompt(student, summary, recommendation, context),
        });

        const parsed = JSON.parse(response.output_text || '{}');
        recommendation = sanitizeRecommendation(parsed, recommendation);
      } catch (error) {
        console.warn('OpenAI recommendation fallback used:', error.message);
      }
    }

    return recommendationRepository.replaceLatestAi(student._id, {
      student: student._id,
      title: recommendation.title,
      reason: recommendation.reason,
      suggestedActions: recommendation.suggestedActions,
      learningPath: recommendation.learningPath || null,
      source: recommendation.source,
      createdBy: recommendation.source === 'ai' ? 'openai' : 'rule-engine',
    });
  },
};