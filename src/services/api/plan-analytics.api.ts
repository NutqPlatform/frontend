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
  masteredSimilarity: number;
  planOutcomeScore: number;
  planOutcomeRating: string;
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
  trendRating: string;
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
  clinicalSummary: string;
  strengthAnalysis: string[];
  weaknessAnalysis: string[];
  treatmentRecommendations: string[];
  suggestedFocusAreas: PlanFocusAreaItemDto[];
  therapistNotes: string[];
  analysisSource: string;
}

export interface RecurringDifficultyItemDto {
  word: string;
  category?: string;
  frequency: number;
  severityScore: number;
  attentionLevel: string;
}

export interface SuggestedNextTherapyContentDto {
  categoriesNeedingReinforcement: string[];
  vocabularyNeedingRepetition: string[];
  difficultyAdjustment: string;
  recommendedExerciseCount: number;
  reasoning: string;
}

export interface PlanSessionWordDto {
  expectedWord: string;
  category?: string;
  totalAttempts: number;
  bestSimilarityScore: number;
  averageSimilarityScore: number;
  succeeded: boolean;
}

export interface PlanSessionTimelineDto {
  sessionNumber: number;
  trainingSessionId: number;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  accuracyPercent: number;
  averageSimilarityScore: number;
  totalAttempts: number;
  wordsSucceeded: number;
  wordsAttempted: number;
  words: PlanSessionWordDto[];
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
  recurringDifficulties: RecurringDifficultyItemDto[];
  suggestedNextContent: SuggestedNextTherapyContentDto;
  sessionTimeline: PlanSessionTimelineDto[];
}

export interface TherapyPlanReportModel {
  reportId: number;
  generatedAt: string;
  doctorName: string;
  patientName: string;
  patientAge: string;
  diagnosis: string;
  planId: number;
  planDescription: string;
  planStatus: string;
  startDate: string;
  endDate: string;
  summary: TherapyPlanSummaryDto;
  words: PlanWordPerformanceDto[];
  categories: PlanCategoryPerformanceDto[];
  progressComparison: PlanProgressComparisonDto;
  clinicalInsights: PlanClinicalInsightsDto;
  recurringDifficulties: RecurringDifficultyItemDto[];
  suggestedNextContent: SuggestedNextTherapyContentDto;
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

export async function getPlanAnalyticsPdfModel(
  doctorId: number,
  planId: number
): Promise<TherapyPlanReportModel> {
  const response = await apiClient.get<TherapyPlanReportModel>(
    `/doctors/${doctorId}/plans/${planId}/analytics/pdf-model`
  );
  return response.data;
}
