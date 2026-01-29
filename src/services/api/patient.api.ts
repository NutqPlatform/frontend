import apiClient from './axios';

export interface PatientProfile {
  id: number;
  name: string;
  email: string;
  age?: number;
  diagnosis?: string;
  profilePicture?: string;
  doctorId?: number;
}

export interface AttendingDoctor {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cv?: string;
}

export async function getPatientProfile(patientId: number): Promise<PatientProfile> {
  const response = await apiClient.get<PatientProfile>(`/Patient/${patientId}/profile`);
  return response.data;
}

export async function updatePatientProfile(
  patientId: number,
  updates: { profilePicture?: string }
): Promise<void> {
  await apiClient.put(`/Patient/${patientId}/profile`, updates);
}

export async function updatePatientPassword(
  patientId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.put(`/Patient/${patientId}/password`, {
    currentPassword,
    newPassword,
  });
}

export async function getAttendingDoctor(patientId: number): Promise<AttendingDoctor | null> {
  try {
    const response = await apiClient.get<AttendingDoctor>(`/Patient/${patientId}/doctor`);
    return response.data;
  } catch {
    return null;
  }
}
