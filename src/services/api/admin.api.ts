import apiClient from './axios';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResult {
  success: boolean;
  userId: number;
  email: string;
  name: string;
  role: string;
  token?: string;
  message: string;
}

export interface DoctorManagementDto {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  isBlocked: boolean;
  averageRating: number;
}

export interface PatientManagementDto {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  doctorId: number;
  isBlocked: boolean;
}

export interface GenerateCodeRequest {
  adminId: number;
  count?: number;
}

export interface GenerateCodeResponse {
  codes: string[];
}

const adminAPI = {
  login: async (credentials: AdminLoginRequest): Promise<AdminAuthResult> => {
    const response = await apiClient.post('/admin/login', credentials);
    return response.data;
  },

  getAllDoctors: async (): Promise<DoctorManagementDto[]> => {
    const response = await apiClient.get('/admin/doctors');
    return response.data;
  },

  getAllPatients: async (): Promise<PatientManagementDto[]> => {
    const response = await apiClient.get('/admin/patients');
    return response.data;
  },

  blockDoctor: async (doctorId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/doctors/${doctorId}/block`);
    return response.data;
  },

  unblockDoctor: async (doctorId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/doctors/${doctorId}/unblock`);
    return response.data;
  },

  blockPatient: async (patientId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/patients/${patientId}/block`);
    return response.data;
  },

  unblockPatient: async (patientId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/patients/${patientId}/unblock`);
    return response.data;
  },

  generateCodes: async (request: GenerateCodeRequest): Promise<GenerateCodeResponse> => {
    const response = await apiClient.post('/admin/generate-code', request);
    return response.data;
  },
};

export default adminAPI;
