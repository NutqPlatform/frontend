import apiClient from './axios';

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  category?: string;
  difficulty?: string;
  difficultyId?: number;
}

// Get all exercises
export async function getAllExercises(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>('/Exercise');
  return response.data;
}

// Add exercise to plan
export interface AddExerciseToPlanRequest {
  exerciseId: number;
  durationMinutes: number;
  repetition: number;
  aiConstraints?: string;
}

export async function addExerciseToPlan(
  planId: number,
  request: AddExerciseToPlanRequest
): Promise<any> {
  const response = await apiClient.post(`/TherapyPlan/plan/${planId}/add-exercise`, request);
  return response.data;
}
