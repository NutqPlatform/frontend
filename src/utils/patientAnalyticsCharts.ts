import type {
  CategoryTrendEntryDto,
  SessionTimelineEntryDto,
} from '../services/api/dashboard.api';

export interface OverallChartPoint {
  sessionIndex: number;
  sessionLabel: string;
  dateLabel: string;
  dateValue: number;
  overallScore: number;
  trainingSessionId: number;
}

export interface CategoryChartPoint {
  sessionIndex: number;
  sessionLabel: string;
  dateLabel: string;
  dateValue: number;
  [category: string]: number | string;
}

const CHART_COLORS = [
  '#111827',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#4d7c0f',
  '#9333ea',
];

export function formatAnalyticsDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAnalyticsDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSessionDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';

  const totalSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function buildOverallChartData(
  sessionTimeline: SessionTimelineEntryDto[]
): OverallChartPoint[] {
  return sessionTimeline.map((session, index) => {
    const date = new Date(session.startTime);
    return {
      sessionIndex: index + 1,
      sessionLabel: `Session ${index + 1}`,
      dateLabel: formatAnalyticsDate(session.startTime),
      dateValue: Number.isNaN(date.getTime()) ? index : date.getTime(),
      overallScore: session.overallScore,
      trainingSessionId: session.trainingSessionId,
    };
  });
}

export function buildCategoryChartData(
  sessionTimeline: SessionTimelineEntryDto[]
): { categories: string[]; data: CategoryChartPoint[]; colors: Record<string, string> } {
  const categories = [
    ...new Set(
      sessionTimeline.flatMap((session) =>
        session.categoryScores.map((category) => category.category)
      )
    ),
  ].sort((a, b) => a.localeCompare(b));

  const colors = Object.fromEntries(
    categories.map((category, index) => [category, CHART_COLORS[index % CHART_COLORS.length]])
  );

  const data = sessionTimeline.map((session, index) => {
    const point: CategoryChartPoint = {
      sessionIndex: index + 1,
      sessionLabel: `Session ${index + 1}`,
      dateLabel: formatAnalyticsDate(session.startTime),
      dateValue: new Date(session.startTime).getTime() || index,
    };

    categories.forEach((category) => {
      const match = session.categoryScores.find((entry) => entry.category === category);
      point[category] = match?.accuracyPercent ?? NaN;
    });

    return point;
  });

  return { categories, data, colors };
}

export function summarizeCategoryTrends(categoryTrends: CategoryTrendEntryDto[]) {
  return {
    improving: categoryTrends.filter((trend) => trend.direction === 'Improving').length,
    declining: categoryTrends.filter((trend) => trend.direction === 'Declining').length,
    stable: categoryTrends.filter((trend) => trend.direction === 'Stable').length,
    insufficient: categoryTrends.filter((trend) => trend.direction === 'InsufficientData').length,
  };
}

export function getTrendBadgeClass(direction: string): string {
  switch (direction) {
    case 'Improving':
      return 'bg-emerald-100 text-emerald-800';
    case 'Declining':
      return 'bg-red-100 text-red-800';
    case 'Stable':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function formatTrendDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}
