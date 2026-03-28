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

export interface DoctorPatient {
  id: number;
  name: string;
  email: string;
  age?: number;
  profilePicture?: string;
}

export interface DoctorWeeklyReport {
  id: number;
  patientId: number;
  patientName?: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  doctorNotes?: string;
  aiSummary?: string;
}

export interface AttendingDoctor {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cv?: string;
  patients?: DoctorPatient[];
  weeklyReports?: DoctorWeeklyReport[];
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
