import type { RepetitionData, SpeechAttemptData, WordAttemptData } from '../services/api/patient-exercises.api';

export function getExpectedWord(wordEnglish: string, wordArabic: string, preferArabic = true): string {
  if (preferArabic && wordArabic.trim()) return wordArabic.trim();
  return wordEnglish.trim();
}

export function recordSpeechAttempt(
  wordData: WordAttemptData,
  params: {
    expectedWord: string;
    recognizedWord: string;
    similarityScore: number;
    isCorrect: boolean;
    isSkipped?: boolean;
    audioDurationSeconds: number;
    attemptedAt?: string;
  }
): SpeechAttemptData {
  if (!wordData.speechAttempts) wordData.speechAttempts = [];

  const attempt: SpeechAttemptData = {
    attemptNumber: wordData.speechAttempts.length + 1,
    expectedWord: params.expectedWord,
    recognizedWord: params.recognizedWord,
    similarityScore: Math.round(params.similarityScore),
    isCorrect: params.isCorrect,
    isSkipped: params.isSkipped,
    audioDurationSeconds: Math.round(params.audioDurationSeconds * 10) / 10,
    attemptedAt: params.attemptedAt ?? new Date().toISOString(),
  };

  wordData.speechAttempts.push(attempt);
  wordData.attempts = wordData.speechAttempts.length;
  // firstTryCorrect is only true if the first REAL (non-skipped) attempt was correct
  const firstRealAttempt = wordData.speechAttempts.find((a) => !a.isSkipped);
  wordData.firstTryCorrect = firstRealAttempt?.isCorrect ?? false;

  return attempt;
}

/**
 * Records a skip event for a word — marks it as not attempted.
 * Skipped words lower completion quality and appear in weaknesses.
 */
export function recordSkippedWord(
  wordData: WordAttemptData,
  expectedWord: string
): SpeechAttemptData {
  return recordSpeechAttempt(wordData, {
    expectedWord,
    recognizedWord: '',
    similarityScore: 0,
    isCorrect: false,
    isSkipped: true,
    audioDurationSeconds: 0,
  });
}

export function createEmptyWordAttempt(word: {
  id: number;
  wordEnglish: string;
  wordArabic: string;
}): WordAttemptData {
  return {
    wordId: word.id,
    wordEnglish: word.wordEnglish,
    wordArabic: word.wordArabic,
    attempts: 0,
    audioPlays: 0,
    firstTryCorrect: true,
    timeSpentSeconds: 0,
    speechAttempts: [],
  };
}

/** Overall accuracy from per-word best attempt similarity */
export function computeOverallAccuracy(repetitions: RepetitionData[]): number {
  const words = repetitions.flatMap((r) => r.words);
  if (words.length === 0) return 100;

  const scores = words.map((w) => {
    if (w.speechAttempts && w.speechAttempts.length > 0) {
      const best = w.speechAttempts.reduce((max, a) => Math.max(max, a.similarityScore), 0);
      return w.speechAttempts.some((a) => a.isCorrect) ? Math.max(best, 70) : best;
    }
    return w.firstTryCorrect ? 100 : Math.max(0, 100 - (w.attempts - 1) * 15);
  });

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

export function buildSessionPayload(
  exerciseType: 'photo_frame' | 'card_match',
  repetitions: RepetitionData[],
  startedAt: string
): string {
  const completedAt = new Date().toISOString();
  const totalDurationSeconds = repetitions.reduce((s, r) => s + r.durationSeconds, 0);
  const overallAccuracyPercent = computeOverallAccuracy(repetitions);

  return JSON.stringify({
    exerciseType,
    startedAt,
    completedAt,
    totalDurationSeconds,
    repetitions,
    overallAccuracyPercent,
  });
}
