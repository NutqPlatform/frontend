import apiClient from './axios';

export interface DoctorProfile {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cv?: string;
}

export interface UpdateDoctorProfileRequest {
  profilePicture?: string;
  cv?: string;
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
