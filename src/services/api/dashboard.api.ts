import apiClient from './axios';

// Patient Dashboard Types
export interface ExerciseProgressDto {
  planExerciseId: number;
  exerciseId: number;
  exerciseName: string;
  completed: boolean;
  started: boolean;
  score?: number;
}

export interface PatientDashboardDto {
  planId: number;
  planName: string;
  planStatus?: string;
  progressPercentage?: number;
  exercises: ExerciseProgressDto[];
}

// Doctor Analytics Types
export interface DoctorAnalyticsDto {
  totalPatients: number;
  totalPlans: number;
  totalExercises: number;
  averageCompletionRate: number;
}

// Doctor Patient Types
export interface Patient {
  id: number;
  name: string;
  email: string;
  age?: number;
}

export interface DoctorPatientsResponse {
  patients: Patient[];
}

export interface GenerateCodeResponse {
  success: boolean;
  message: string;
  code: string;
}

// Patient Dashboard API
export async function getPatientDashboard(patientId: number): Promise<PatientDashboardDto[]> {
  const response = await apiClient.get<PatientDashboardDto[]>(`/patient-dashboard/${patientId}`);
  return response.data;
}

// Doctor Analytics API
export async function getDoctorAnalytics(doctorId: number): Promise<DoctorAnalyticsDto> {
  const response = await apiClient.get<DoctorAnalyticsDto>(`/doctor-analytics/${doctorId}`);
  return response.data;
}

// Doctor Patients API
export async function getDoctorPatients(doctorId: number): Promise<Patient[]> {
  const response = await apiClient.get<DoctorPatientsResponse>(`/Doctor/${doctorId}/patients`);
  return response.data.patients;
}

// Generate Patient Code API
export async function generatePatientCode(doctorId: number): Promise<string> {
  const response = await apiClient.post<GenerateCodeResponse>(
    `/Doctor/${doctorId}/generate-patient-code`
  );
  return response.data.code;
}

// Therapy Plan Types
export interface TherapyPlan {
  id: number;
  description?: string;
  status?: string;
  startDate: string;
  endDate?: string;
  exercises?: any[];
}

// Get ongoing plans for doctor
export interface OngoingPlan {
  id: number;
  description?: string;
  status?: string;
  startDate: string;
  endDate?: string;
  patientId?: number;
  patientName?: string;
  progressPercentage?: number;
  exercises?: any[];
}

export async function getOngoingPlans(doctorId: number): Promise<OngoingPlan[]> {
  const response = await apiClient.get<OngoingPlan[]>(`/TherapyPlan/doctor/${doctorId}/ongoing-plans`);
  return response.data;
}
