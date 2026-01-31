import apiClient from './axios';

// Types
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

// API calls
export async function getPlanExercises(
  patientId: number,
  planId: number
): Promise<PlanExerciseDto[]> {
  const response = await apiClient.get<PlanExerciseDto[]>(
    `/patient-exercises/${patientId}/plans/${planId}/exercises`
  );
  return response.data;
}

export async function getExerciseVocabulary(
  patientId: number,
  planExerciseId: number
): Promise<VocabularyDto[]> {
  const response = await apiClient.get<VocabularyDto[]>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/vocabulary`
  );
  return response.data;
}

export async function startExercise(
  patientId: number,
  planExerciseId: number
): Promise<{ message: string; startTime: string }> {
  const response = await apiClient.post<{ message: string; startTime: string }>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/start`
  );
  return response.data;
}

export async function completeExercise(
  patientId: number,
  planExerciseId: number
): Promise<{ message: string; endTime: string }> {
  const response = await apiClient.post<{ message: string; endTime: string }>(
    `/patient-exercises/${patientId}/exercises/${planExerciseId}/complete`
  );
  return response.data;
}

// Exercise progress for determining state (from exercise-progress API)
export interface ExerciseProgressDto {
  id: number;
  patientId: number;
  planExerciseId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  completed: boolean;
  exerciseName: string;
}

export async function getPatientProgress(
  patientId: number
): Promise<ExerciseProgressDto[]> {
  const response = await apiClient.get<ExerciseProgressDto[]>(
    `/exercise-progress/patient/${patientId}`
  );
  return response.data;
}

export function deriveExerciseState(
  progressList: ExerciseProgressDto[],
  planExerciseId: number
): ExerciseState {
  const prog = progressList.find((p) => p.planExerciseId === planExerciseId);
  if (!prog) return 'not_started';
  if (prog.completed) return 'completed';
  return 'started';
}
