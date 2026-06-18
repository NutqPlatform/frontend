import apiClient from './axios';

export interface TransferRequest {
  id: number;
  patientId: number;
  patientName?: string;
  fromDoctorId?: number;
  fromDoctorName?: string;
  toDoctorId: number;
  toDoctorName?: string;
  status: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface FormerPatient {
  patientId: number;
  name: string;
  email: string;
  profilePicture?: string;
  assignedAt: string;
  leftAt?: string;
  diagnosis?: string;
  diagnosisFileUrl?: string;
}

export async function leaveDoctor(patientId: number): Promise<void> {
  await apiClient.post(`/Transfer/patient/${patientId}/leave`);
}

export async function releasePatient(doctorId: number, patientId: number): Promise<void> {
  await apiClient.post(`/Transfer/doctor/${doctorId}/patients/${patientId}/release`);
}

export async function requestTransfer(patientId: number, toDoctorId: number, message?: string): Promise<TransferRequest> {
  const res = await apiClient.post<TransferRequest>(`/Transfer/patient/${patientId}/request`, { toDoctorId, message });
  return res.data;
}

export async function doctorInitiateTransfer(
  doctorId: number,
  patientId: number,
  toDoctorId: number,
  message?: string
): Promise<TransferRequest> {
  const res = await apiClient.post<TransferRequest>(
    `/Transfer/doctor/${doctorId}/patients/${patientId}/transfer`,
    { toDoctorId, message }
  );
  return res.data;
}

export async function acceptTransferRequest(doctorId: number, requestId: number): Promise<void> {
  await apiClient.post(`/Transfer/doctor/${doctorId}/requests/${requestId}/accept`);
}

export async function rejectTransferRequest(doctorId: number, requestId: number): Promise<void> {
  await apiClient.post(`/Transfer/doctor/${doctorId}/requests/${requestId}/reject`);
}

export async function cancelTransferRequest(patientId: number, requestId: number): Promise<void> {
  await apiClient.delete(`/Transfer/patient/${patientId}/requests/${requestId}`);
}

export async function getDoctorTransferRequests(doctorId: number): Promise<TransferRequest[]> {
  const res = await apiClient.get<TransferRequest[]>(`/Transfer/doctor/${doctorId}/requests`);
  return res.data;
}

export async function getPatientTransferRequests(patientId: number): Promise<TransferRequest[]> {
  const res = await apiClient.get<TransferRequest[]>(`/Transfer/patient/${patientId}/requests`);
  return res.data;
}

export async function getFormerPatients(doctorId: number): Promise<FormerPatient[]> {
  const res = await apiClient.get<FormerPatient[]>(`/Transfer/doctor/${doctorId}/former-patients`);
  return res.data;
}
