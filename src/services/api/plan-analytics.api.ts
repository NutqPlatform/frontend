import apiClient from './axios';

export interface TherapyPlanSummaryDto {
  totalSessionDurationSeconds: number;
  totalWordsPracticed: number;
  totalSpeechAttempts: number;
  wordSuccessRate: number;
  attemptAccuracyRate: number;
  firstAttemptSuccessRate: number;
  averagePronunciationSimilarity: number;
  totalFailedWords: number;
  totalCompletedWords: number;
  totalSessions: number;
}

export interface RecognizedWordHistoryDto {
  attemptNumber: number;
  recognizedWord: string;
  similarityScore: number;
  isCorrect: boolean;
}

export interface PlanWordPerformanceDto {
  word: string;
  wordEnglish: string;
  wordArabic: string;
  category?: string;
  totalAttempts: number;
  bestSimilarityScore: number;
  averageSimilarityScore: number;
  firstAttemptSuccess: boolean;
  finalSuccess: boolean;
  timeSpentSeconds: number;
  recognizedWordHistory: RecognizedWordHistoryDto[];
}

export interface PlanCategoryPerformanceDto {
  category: string;
  wordsAttempted: number;
  wordsSucceeded: number;
  accuracyPercent: number;
  averageSimilarity: number;
  averageAttemptsPerWord: number;
}

export interface PlanStrengthAnalysisDto {
  bestPerformingWords: PlanWordPerformanceDto[];
  bestPerformingCategories: PlanCategoryPerformanceDto[];
  masteredOnFirstAttempt: PlanWordPerformanceDto[];
  consistentlyStrongAreas: string[];
}

export interface PlanWeaknessAnalysisDto {
  failedWords: PlanWordPerformanceDto[];
  highRetryWords: PlanWordPerformanceDto[];
  lowPerformanceCategories: PlanCategoryPerformanceDto[];
  lowSimilarityWords: PlanWordPerformanceDto[];
  recurringDifficulties: string[];
}

export interface PlanPeriodComparisonDto {
  period: string;
  accuracyDelta?: number;
  similarityDelta?: number;
  firstAttemptDelta?: number;
  hasData: boolean;
}

export interface PlanProgressComparisonDto {
  vsPreviousSession: PlanPeriodComparisonDto;
  vsPreviousPlan: PlanPeriodComparisonDto;
  vsLast7Days: PlanPeriodComparisonDto;
  vsLast30Days: PlanPeriodComparisonDto;
}

export interface PlanFocusAreaItemDto {
  area: string;
  rationale: string;
  priority: number;
}

export interface PlanClinicalInsightsDto {
  strengths: string[];
  weaknesses: string[];
  recommendedFocusAreas: PlanFocusAreaItemDto[];
  suggestedNextExercises: string[];
  therapyAttentionAreas: string[];
  analysisSource: string;
}

export interface TherapyPlanAnalyticsDto {
  planId: number;
  patientId: number;
  planDescription: string;
  planStatus: string;
  startDate: string;
  endDate?: string;
  summary: TherapyPlanSummaryDto;
  words: PlanWordPerformanceDto[];
  categories: PlanCategoryPerformanceDto[];
  strengths: PlanStrengthAnalysisDto;
  weaknesses: PlanWeaknessAnalysisDto;
  progressComparison: PlanProgressComparisonDto;
  clinicalInsights: PlanClinicalInsightsDto;
}

export async function getPlanAnalytics(
  doctorId: number,
  planId: number
): Promise<TherapyPlanAnalyticsDto> {
  const response = await apiClient.get<TherapyPlanAnalyticsDto>(
    `/doctors/${doctorId}/plans/${planId}/analytics`
  );
  return response.data;
}
