import apiClient from './axios';

export interface PatientDetails {
  id: number;
  name: string;
  email: string;
  age?: number;
  diagnosis?: string;
  diagnosisFileUrl?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  createdAt?: string;
}

export interface PlanExercise {
  id: number;
  therapyPlanId: number;
  exerciseId: number;
  durationMinutes?: number;
  repetition?: number;
  aiConstraints?: string;
  exercise?: {
    id: number;
    name: string;
    description?: string;
    category?: string;
    difficulty?: string;
  };
}

export interface TherapyPlan {
  id: number;
  description?: string;
  status?: string;
  startDate: string;
  endDate?: string;
  exercises?: PlanExercise[];
}

export interface CreatePlanRequest {
  description?: string;
  status?: string;
  startDate: Date;
  endDate?: Date;
  exercises: PlanExerciseInput[];
}

export interface PlanExerciseInput {
  exerciseId: number;
  durationMinutes: number;
  repetition: number;
  aiConstraints?: string;
}

// Get single patient details
export async function getPatientDetails(
  doctorId: number,
  patientId: number
): Promise<PatientDetails> {
  const response = await apiClient.get<PatientDetails>(
    `/Doctor/${doctorId}/patients/${patientId}`
  );
  return response.data;
}

// Get patient's therapy plans
export async function getPatientPlans(
  doctorId: number,
  patientId: number
): Promise<TherapyPlan[]> {
  const response = await apiClient.get<TherapyPlan[]>(
    `/TherapyPlan/doctor/${doctorId}/patients/${patientId}/plans`
  );
  return response.data;
}

// Create a new therapy plan for a patient
export async function createPlan(
  doctorId: number,
  patientId: number,
  plan: CreatePlanRequest
): Promise<TherapyPlan> {
  const response = await apiClient.post<TherapyPlan>(
    `/TherapyPlan/doctor/${doctorId}/patients/${patientId}/plan`,
    {
      description: plan.description,
      status: plan.status || 'Active',
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate?.toISOString(),
      exercises: plan.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        durationMinutes: ex.durationMinutes,
        repetition: ex.repetition,
        aiConstraints: ex.aiConstraints,
      })),
    }
  );
  return response.data;
}

// Update patient diagnosis
export async function updatePatientDiagnosis(
  doctorId: number,
  patientId: number,
  diagnosis: string,
  diagnosisFileBase64?: string,
  diagnosisFileName?: string
): Promise<void> {
  await apiClient.put(
    `/Doctor/${doctorId}/patients/${patientId}/diagnosis`,
    { diagnosis, diagnosisFileBase64, diagnosisFileName }
  );
}

// Delete exercise from plan
export async function deleteExerciseFromPlan(
  planId: number,
  planExerciseId: number
): Promise<void> {
  await apiClient.delete(`/TherapyPlan/plan/${planId}/exercise/${planExerciseId}`);
}

// Update plan status
export async function updatePlanStatus(
  planId: number,
  status: string
): Promise<void> {
  await apiClient.put(`/TherapyPlan/plan/${planId}/status`, { status });
}

// Get plan progress
export async function getPlanProgress(planId: number): Promise<{
  progressPercentage: number;
  completedExercises: number;
  totalExercises: number;
}> {
  const response = await apiClient.get(`/TherapyPlan/plan/${planId}/progress`);
  return response.data;
}
