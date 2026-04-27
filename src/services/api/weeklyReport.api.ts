import apiClient from './axios';

export interface WeeklyReportCreateDto {
  doctorId: number;
  patientId: number;
  therapyPlanId?: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  doctorNotes?: string;
}

export interface WeeklyReportDto {
  id: number;
  doctorId: number;
  patientId: number;
  therapyPlanId?: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  doctorNotes?: string;
}

export async function createWeeklyReport(dto: WeeklyReportCreateDto): Promise<WeeklyReportDto> {
  const resp = await apiClient.post<WeeklyReportDto>('/weekly-reports', dto);
  return resp.data;
}

export async function updateWeeklyReport(id: number, dto: WeeklyReportCreateDto): Promise<WeeklyReportDto> {
  const resp = await apiClient.put<WeeklyReportDto>(`/weekly-reports/${id}`, dto);
  return resp.data;
}

export async function getReportByPlan(planId: number): Promise<WeeklyReportDto | null> {
  try {
    const resp = await apiClient.get<WeeklyReportDto | null>(`/weekly-reports/plan/${planId}`);
    return resp.data;
  } catch (err) {
    return null;
  }
}

export async function getReportsForPatient(patientId: number): Promise<WeeklyReportDto[]> {
  const resp = await apiClient.get<WeeklyReportDto[]>(`/weekly-reports/patient/${patientId}`);
  return resp.data;
}
