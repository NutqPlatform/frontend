import apiClient from './axios';

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  category?: string;
  difficulty?: string;
  difficultyId?: number;
  imageUrl?: string;
  assetUrl?: string;
}

// Get all exercises
export async function getAllExercises(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>('/Exercise');
  return response.data;
}

// Get vocabulary by category & difficulty (for doctor try flow)
export async function getVocabularyByCategory(category: string, difficulty: string) {
  const response = await apiClient.get(`/vocabulary?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}`);
  return response.data as Array<{
    id: number;
    wordEnglish: string;
    wordArabic: string;
    imageUrl?: string;
    soundUrl?: string;
  }>;
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
): Promise<any[]> {
  const response = await apiClient.post(`/TherapyPlan/plan/${planId}/add-exercise`, request);
  return response.data;
}
