import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;
const MAX_TEXT_CHARS = 15000;


function normalizeText(input) {
  return (input || '').replace(/\s+/g, ' ').trim();
  
}

function chunkSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildFallbackStudyPack(text, fileName) {
  const sentences = chunkSentences(text);
  const summary = (sentences.slice(0, 3).join(' ') || text.slice(0, 380) || `Summary generated from ${fileName}.`).trim();

  const keyPoints = sentences
    .filter((sentence) => sentence.length > 50)
    .slice(0, 6)
    .map((sentence) => sentence.replace(/[.\s]+$/, ''));

  const flashcards = keyPoints.slice(0, 6).map((point, index) => ({
    question: `Key concept ${index + 1}: What should you remember?`,
    answer: point,
  }));

  const quizQuestions = keyPoints.slice(0, 5).map((point, index) => {
    const distractors = [
      'It is not discussed in this section.',
      'It is a minor detail and not a learning priority.',
      'It only applies to unrelated topics outside this document.',
    ];
    return {
      questionText: `Which statement best matches key point ${index + 1}?`,
      options: [point, ...distractors],
      correctAnswer: point,
    };
  });

  return {
    summary,
    simplifiedExplanation: `This document explains key ideas about ${fileName}. In simple terms: ${summary}`,
    keyPoints,
    flashcards,
    quiz: {
      title: `Quiz: ${fileName}`,
      questions: quizQuestions,
    },
    source: 'rule',
  };
}

function parseJsonResponse(responseText) {
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeStudyPack(payload, fallback, fileName) {
  if (!payload || typeof payload !== 'object') return fallback;

  const summary = typeof payload.summary === 'string' && payload.summary.trim()
    ? payload.summary.trim()
    : fallback.summary;

  const keyPoints = Array.isArray(payload.keyPoints)
    ? payload.keyPoints.filter((item) => typeof item === 'string' && item.trim()).slice(0, 8)
    : fallback.keyPoints;

  const simplifiedExplanation = typeof payload.simplifiedExplanation === 'string' && payload.simplifiedExplanation.trim()
    ? payload.simplifiedExplanation.trim()
    : fallback.simplifiedExplanation;

  const flashcards = Array.isArray(payload.flashcards)
    ? payload.flashcards
      .map((card) => ({
        question: typeof card?.question === 'string' ? card.question.trim() : '',
        answer: typeof card?.answer === 'string' ? card.answer.trim() : '',
      }))
      .filter((card) => card.question && card.answer)
      .slice(0, 10)
    : fallback.flashcards;

  const quizQuestions = Array.isArray(payload.quiz?.questions)
    ? payload.quiz.questions
      .map((question) => {
        const options = Array.isArray(question?.options)
          ? question.options.filter((option) => typeof option === 'string' && option.trim()).slice(0, 4)
          : [];

        const correctAnswer = typeof question?.correctAnswer === 'string' ? question.correctAnswer.trim() : '';
        if (!question?.questionText || !options.length || !correctAnswer || !options.includes(correctAnswer)) return null;

        return {
          questionText: question.questionText.trim(),
          options,
          correctAnswer,
        };
      })
      .filter(Boolean)
      .slice(0, 10)
    : fallback.quiz.questions;

  return {
    summary,
    simplifiedExplanation,
    keyPoints: keyPoints.length ? keyPoints : fallback.keyPoints,
    flashcards: flashcards.length ? flashcards : fallback.flashcards,
    quiz: {
      title: typeof payload.quiz?.title === 'string' && payload.quiz.title.trim()
        ? payload.quiz.title.trim()
        : `Quiz: ${fileName}`,
      questions: quizQuestions.length ? quizQuestions : fallback.quiz.questions,
    },
    source: payload.source === 'ai' ? 'ai' : fallback.source,
  };
}

export const aiDocumentService = {
  async generateStudyPack(rawText, fileName) {
    const normalizedText = normalizeText(rawText).slice(0, MAX_TEXT_CHARS);
    const fallback = buildFallbackStudyPack(normalizedText, fileName);

    if (!client) return fallback;

    try {
      const prompt = [
        'You are helping a student study a PDF document.',
        'Return ONLY valid JSON with this schema:',
        '{"summary":"string","simplifiedExplanation":"string","keyPoints":["string"],"flashcards":[{"question":"string","answer":"string"}],"quiz":{"title":"string","questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswer":"string"}]},"source":"ai"}',
        'Rules:',
        '- summary: 90-160 words',
        '- simplifiedExplanation: 120-220 words written for a beginner using simple language and examples',
        '- keyPoints: 4-8 concise, practical points',
        '- flashcards: 5-10 cards',
        '- quiz: 5-10 multiple choice questions, exactly 4 options each',
        '- correctAnswer must be one of options',
        '- no markdown and no extra text outside JSON',
        `File name: ${fileName}`,
        `Document text: ${normalizedText}`,
      ].join('\n');

      const response = await client.responses.create({
        model: env.openaiModel,
        input: prompt,
      });

      const parsed = parseJsonResponse(response.output_text);
      return sanitizeStudyPack(parsed, fallback, fileName);
    } catch (error) {
      console.warn('OpenAI document analysis fallback used:', error.message);
      return fallback;
    }
  },

  async answerQuestion(document, question) {
    const cleanQuestion = (question || '').trim();
    if (!cleanQuestion) {
      return {
        answer: 'Please type a question so I can help you understand the document.',
        source: 'rule',
      };
    }

    const fallbackAnswer = [
      `Based on ${document.fileName}:`,
      document.simplifiedExplanation || document.summary,
      '',
      'Relevant key points:',
      ...(document.keyPoints || []).slice(0, 4).map((point, index) => `${index + 1}. ${point}`),
    ].join('\n');

    if (!client) {
      return { answer: fallbackAnswer, source: 'rule' };
    }

    try {
      const textContext = (document.extractedText || '').slice(0, MAX_TEXT_CHARS);
      const prompt = [
        'You are an AI tutor helping a student understand one uploaded document.',
        'Answer using only the provided document context. If the answer is not in the document, clearly say it is not found in the document.',
        'Explain clearly and simply in 4-8 sentences.',
        `Document name: ${document.fileName}`,
        `Summary: ${document.summary}`,
        `Simplified explanation: ${document.simplifiedExplanation || ''}`,
        `Key points: ${(document.keyPoints || []).join(' | ')}`,
        `Extracted content: ${textContext}`,
        `Student question: ${cleanQuestion}`,
      ].join('\n');

      const response = await client.responses.create({
        model: env.openaiModel,
        input: prompt,
      });

      const answer = (response.output_text || '').trim();
      if (!answer) return { answer: fallbackAnswer, source: 'rule' };
      return { answer, source: 'ai' };
    } catch (error) {
      console.warn('OpenAI document chat fallback used:', error.message);
      return { answer: fallbackAnswer, source: 'rule' };
    }
  },
};
