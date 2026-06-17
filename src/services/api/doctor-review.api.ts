import apiClient from './axios';

export interface DoctorReviewCreateRequest {
  doctorId: number;
  patientId: number;
  rating: number;
  comment?: string;
}

export interface DoctorReviewUpdateRequest {
  rating: number;
  comment?: string;
}

export interface DoctorReviewDto {
  id: number;
  doctorId: number;
  patientId: number;
  patientName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface DoctorRatingDto {
  doctorId: number;
  averageRating: number;
  totalReviews: number;
  reviews: DoctorReviewDto[];
}

const doctorReviewAPI = {
  createReview: async (request: DoctorReviewCreateRequest): Promise<DoctorReviewDto> => {
    const response = await apiClient.post('/DoctorReview', request);
    return response.data;
  },

  getDoctorReviews: async (doctorId: number): Promise<DoctorRatingDto> => {
    const response = await apiClient.get(`/DoctorReview/doctor/${doctorId}`);
    return response.data;
  },

  updateReview: async (
    doctorId: number,
    patientId: number,
    request: DoctorReviewUpdateRequest
  ): Promise<DoctorReviewDto> => {
    const response = await apiClient.put(
      `/DoctorReview/${doctorId}/${patientId}`,
      request
    );
    return response.data;
  },

  deleteReview: async (doctorId: number, patientId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/DoctorReview/${doctorId}/${patientId}`);
    return response.data;
  },
};

export default doctorReviewAPI;
