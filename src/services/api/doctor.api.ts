import apiClient from './axios';

export interface DoctorProfile {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cv?: string;
  phoneNumber?: string;
  communicationInfo?: string;
  address?: string;
  dateOfBirth?: string;
  age?: number;
  createdAt?: string;
  averageRating?: number;
  cvText?: string;
}

export interface DoctorPatient {
  id: number;
  name: string;
  email: string;
  age?: number;
  phoneNumber?: string;
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

export interface DoctorWithCommunications extends DoctorProfile {
  patients: DoctorPatient[];
  weeklyReports: DoctorWeeklyReport[];
}

export interface UpdateDoctorProfileRequest {
  profilePicture?: string;
  cv?: string;
  cvFileBase64?: string;
  cvFileName?: string;
  name?: string;
  phoneNumber?: string;
  communicationInfo?: string;
  address?: string;
  dateOfBirth?: string;
  cvText?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Get doctor profile
export async function getDoctorProfile(doctorId: number): Promise<DoctorProfile> {
  const response = await apiClient.get<DoctorProfile>(`/Doctor/${doctorId}/profile`);
  return response.data;
}

// Get doctor with communications (patients + weekly reports)
export async function getDoctorCommunications(
  doctorId: number
): Promise<DoctorWithCommunications> {
  const response = await apiClient.get<DoctorWithCommunications>(`/Doctor/${doctorId}/communications`);
  return response.data;
}

// Get all doctors + communications
export async function getAllDoctorsWithCommunications(): Promise<DoctorWithCommunications[]> {
  const response = await apiClient.get<{ doctors: DoctorWithCommunications[] }>(`/Doctor/all`);
  return response.data.doctors;
}

// Update doctor profile (photo, CV)
export async function updateDoctorProfile(
  doctorId: number,
  updates: UpdateDoctorProfileRequest
): Promise<void> {
  await apiClient.put(`/Doctor/${doctorId}/profile`, updates);
}

// Update doctor password
export async function updateDoctorPassword(
  doctorId: number,
  passwordData: UpdatePasswordRequest
): Promise<void> {
  await apiClient.put(`/Doctor/${doctorId}/password`, passwordData);
}

// Get single doctor with communications (for detail page)
export async function getSingleDoctor(
  doctorId: number
): Promise<DoctorWithCommunications> {
  const response = await apiClient.get<DoctorWithCommunications>(`/Doctor/${doctorId}/communications`);
  return response.data;
}
