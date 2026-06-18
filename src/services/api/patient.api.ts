import apiClient from './axios';

export interface PatientProfile {
  id: number;
  name: string;
  email: string;
  age?: number;
  phoneNumber?: string;
  diagnosis?: string;
  diagnosisFileUrl?: string;
  profilePicture?: string;
  doctorId?: number;
  hasDoctor?: boolean;
  formerDoctorId?: number;
  dateOfBirth?: string;
  createdAt?: string;
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
  cvText?: string;
  phoneNumber?: string;
  address?: string;
  communicationInfo?: string;
  age?: number;
  averageRating?: number;
  patients?: DoctorPatient[];
  weeklyReports?: DoctorWeeklyReport[];
}

export async function getPatientProfile(patientId: number): Promise<PatientProfile> {
  const response = await apiClient.get<PatientProfile>(`/Patient/${patientId}/profile`);
  return response.data;
}

export async function updatePatientProfile(
  patientId: number,
  updates: { profilePicture?: string; phoneNumber?: string; dateOfBirth?: string }
): Promise<PatientProfile> {
  const response = await apiClient.put<PatientProfile>(`/Patient/${patientId}/profile`, updates);
  return response.data;
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
    const response = await apiClient.get<AttendingDoctor | { hasDoctor: false }>(`/Patient/${patientId}/doctor`);
    const data = response.data;
    if (data && typeof data === 'object' && 'hasDoctor' in data && !data.hasDoctor) {
      return null;
    }
    return data as AttendingDoctor;
  } catch {
    return null;
  }
}
