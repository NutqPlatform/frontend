import apiClient from './axios';

export interface PlanExerciseDto {
  id: number;
  therapyPlanId: number;
  exerciseId: number;
  durationMinutes: number;
  repetition: number;
  aiConstraints?: string;
  exercise?: {
    id: number;
    name: string;
    description?: string;
    category?: string;
    difficulty?: string;
    difficultyId?: number;
  };
}

export interface VocabularyDto {
  id: number;
  wordArabic: string;
  wordEnglish: string;
  category?: string;
  difficultyLevelName?: string;
  imageUrl?: string;
  soundUrl?: string;
  videoUrl?: string;
}

export type ExerciseState = 'not_started' | 'started' | 'completed';

export interface SpeechAttemptData {
  attemptNumber: number;
  expectedWord: string;
  recognizedWord: string;
  similarityScore: number;
  isCorrect: boolean;
  audioDurationSeconds: number;
  attemptedAt: string;
}

// Rich analytics for AI/doctor analysis
export interface WordAttemptData {
  wordId: number;
  wordEnglish: string;
  wordArabic: string;
  attempts: number;
  audioPlays: number;
  firstTryCorrect: boolean;
  timeSpentSeconds: number;
  speechAttempts?: SpeechAttemptData[];
}

export interface RepetitionData {
  repetitionNumber: number;
  completedAt: string;
  words: WordAttemptData[];
  accuracyPercent: number;
  durationSeconds: number;
}

export interface SessionAnalytics {
  exerciseType: 'photo_frame' | 'card_match';
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
  overallAccuracyPercent: number;
  repetitions: RepetitionData[];
  totalWords: number;
  totalAttempts: number;
  hardWords: string[];
}

export async function getPlanExercises(patientId: number, planId: number): Promise<PlanExerciseDto[]> {
  const response = await apiClient.get<PlanExerciseDto[]>(`/patient-exercises/${patientId}/plans/${planId}/exercises`);
  return response.data;
}

export async function getExerciseVocabulary(patientId: number, planExerciseId: number): Promise<VocabularyDto[]> {
  const response = await apiClient.get<VocabularyDto[]>(`/patient-exercises/${patientId}/exercises/${planExerciseId}/vocabulary`);
  return response.data;
}

export async function startExercise(patientId: number, planExerciseId: number): Promise<{ message: string; startTime: string }> {
  const response = await apiClient.post<{ message: string; startTime: string }>(`/patient-exercises/${patientId}/exercises/${planExerciseId}/start`);
  return response.data;
}

export async function completeExercise(
  patientId: number,
  planExerciseId: number,
  analytics?: { score?: number; sessionData?: string }
): Promise<{ message: string; endTime: string }> {
  const response = await apiClient.post<{ message: string; endTime: string }>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/complete`,
    analytics ?? {}
  );
  return response.data;
}

export interface ExerciseProgressDto {
  id: number;
  patientId: number;
  planExerciseId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  completed: boolean;
  exerciseName: string;
  currentRepetition: number;
  totalRepetitions: number;
  sessionData?: string;
}

export async function getPatientProgress(patientId: number): Promise<ExerciseProgressDto[]> {
  const response = await apiClient.get<ExerciseProgressDto[]>(`/exercise-progress/patient/${patientId}`);
  return response.data;
}

export async function completeRepetition(
  patientId: number,
  planExerciseId: number,
  analytics?: { sessionData?: string }
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/complete-repetition`,
    analytics ?? {}
  );
  return response.data;
}

export function deriveExerciseState(progressList: ExerciseProgressDto[], planExerciseId: number): ExerciseState {
  const prog = progressList.find((p) => p.planExerciseId === planExerciseId);
  if (!prog) return 'not_started';
  if (prog.completed) return 'completed';
  return 'started';
}

export interface SpeechAttemptSummaryDto {
  attemptNumber: number;
  expectedWord: string;
  recognizedWord: string;
  similarityScore: number;
  isCorrect: boolean;
  audioDurationSeconds: number;
  attemptedAt: string;
}

export interface WordSessionPerformanceDto {
  vocabularyId?: number;
  expectedWord: string;
  wordEnglish: string;
  wordArabic: string;
  totalAttempts: number;
  firstAttemptCorrect: boolean;
  bestSimilarityScore: number;
  averageSimilarityScore: number;
  succeeded: boolean;
  attempts: SpeechAttemptSummaryDto[];
}

export interface PatientExerciseSessionAnalyticsDto {
  trainingSessionId: number;
  exerciseProgressId: number;
  exerciseName: string;
  startTime: string;
  endTime: string;
  totalDurationSeconds: number;
  wordsCompleted: number;
  firstAttemptCorrectCount: number;
  accuracyPercent: number;
  firstAttemptSuccessRate: number;
  averageSimilarityScore: number;
  words: WordSessionPerformanceDto[];
  strengthAreas: string[];
  weaknessAreas: string[];
}

export async function getExerciseSessionAnalytics(
  patientId: number,
  planExerciseId: number
): Promise<PatientExerciseSessionAnalyticsDto> {
  const response = await apiClient.get<PatientExerciseSessionAnalyticsDto>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/session-analytics`
  );
  return response.data;
}