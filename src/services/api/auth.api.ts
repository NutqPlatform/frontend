import apiClient from './axios';

export interface AuthResult {
  token: string;
  expires: string;
  userId: number;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DoctorRegisterPayload {
  invitationCode: string;
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface PatientRegisterPayload {
  invitationCode: string;
  name: string;
  // ISO date string (YYYY-MM-DD)
  dateOfBirth?: string;
  // optional phone number
  phoneNumber?: string;
  email: string;
  password: string;
}

export async function loginDoctor(payload: LoginPayload): Promise<AuthResult> {
  const response = await apiClient.post<AuthResult>('/Auth/login/doctor', payload);
  return response.data;
}

export async function loginPatient(payload: LoginPayload): Promise<AuthResult> {
  const response = await apiClient.post<AuthResult>('/Auth/login/patient', payload);
  return response.data;
}

export async function registerDoctor(payload: DoctorRegisterPayload): Promise<string> {
  const response = await apiClient.post<string>('/Registration/doctor', payload);
  return response.data;
}

export async function registerPatient(payload: PatientRegisterPayload): Promise<string> {
  const response = await apiClient.post<string>('/Registration/patient', payload);
  return response.data;
}

