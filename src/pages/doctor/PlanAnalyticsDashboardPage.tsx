import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Activity,
  Target,
  FileText,
  Clock,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Award,
  BookOpen,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPlanAnalytics, type TherapyPlanAnalyticsDto, type PlanWordPerformanceDto, type PlanCategoryPerformanceDto } from '../../services/api/plan-analytics.api';
import { getPatientDetails } from '../../services/api/patients.api';
import { formatAnalyticsDate, getTrendBadgeClass } from '../../utils/patientAnalyticsCharts';

const CHART_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#be185d', // pink
  '#4d7c0f', // lime
  '#9333ea', // purple
  '#111827', // dark gray
];

// Helper to format duration in seconds into readable hours/minutes/seconds
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Helper to display delta percentages with trend descriptions in the comparison tab
function renderDeltaCell(delta: number | undefined, hasData: boolean, trendRating: string) {
  if (!hasData || delta === undefined || delta === null) {
    return <span className="text-gray-400 font-normal">N/A</span>;
  }

  const rounded = Math.round(delta * 10) / 10;
  const ratingBadge = (
    <span
      className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
        trendRating === 'Strong Improvement' ? 'bg-emerald-100 text-emerald-800' :
        trendRating === 'Improving' ? 'bg-blue-100 text-blue-800' :
        trendRating === 'Declining' ? 'bg-red-100 text-red-800' :
        trendRating === 'Critical Decline' ? 'bg-red-200 text-red-950 border border-red-300' :
        'bg-gray-100 text-gray-800'
      }`}
    >
      {trendRating}
    </span>
  );

  if (rounded > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
        <TrendingUp className="h-4 w-4" />
        +{rounded}%
        {ratingBadge}
      </span>
    );
  }
  if (rounded < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-600">
        <TrendingDown className="h-4 w-4" />
        {rounded}%
        {ratingBadge}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
      <Minus className="h-4 w-4" />
      0%
      {ratingBadge}
    </span>
  );
}

export function PlanAnalyticsDashboardPage() {
  const { patientId: patientIdParam, planId: planIdParam } = useParams<{
    patientId: string;
    planId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<TherapyPlanAnalyticsDto | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state: summary, words, categories, strengths-weaknesses, progress, insights
  const [activeTab, setActiveTab] = useState<string>('summary');

  // Words table search, sorting and filtering state
  const [wordSearch, setWordSearch] = useState('');
  const [wordFilter, setWordFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [wordSortField, setWordSortField] = useState<keyof PlanWordPerformanceDto>('totalAttempts');
  const [wordSortDirection, setWordSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedWords, setExpandedWords] = useState<Record<string, boolean>>({});

  const patientId = patientIdParam ? parseInt(patientIdParam, 10) : NaN;
  const planId = planIdParam ? parseInt(planIdParam, 10) : NaN;

  const loadData = async () => {
    if (!user?.id || user.role !== 'doctor' || Number.isNaN(patientId) || Number.isNaN(planId)) {
      setError('Invalid session parameters.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsData, patientData] = await Promise.all([
        getPlanAnalytics(user.id, planId),
        getPatientDetails(user.id, patientId).catch(() => null),
      ]);

      setAnalytics(analyticsData);
      setPatientName(patientData?.name ?? `Patient #${patientId}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })
        ?.response?.status;
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;

      if (status === 403) {
        setError('Access denied: You do not own this patient or plan.');
      } else if (status === 404) {
        setError('Therapy plan analytics not found.');
      } else {
        setError(message ?? 'Failed to load therapy plan analytics.');
      }
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.role, patientId, planId]);

  // Handle word sorting logic
  const handleSort = (field: keyof PlanWordPerformanceDto) => {
    if (wordSortField === field) {
      setWordSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setWordSortField(field);
      setWordSortDirection('desc');
    }
  };

  const toggleWordExpanded = (word: string) => {
    setExpandedWords((prev) => ({
      ...prev,
      [word]: !prev[word],
    }));
  };

  // Filtered and sorted word breakdown
  const processedWords = useMemo(() => {
    if (!analytics?.words) return [];

    let filtered = [...analytics.words];

    // Search query filter
    if (wordSearch.trim()) {
      const q = wordSearch.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.wordEnglish.toLowerCase().includes(q) ||
          w.wordArabic.toLowerCase().includes(q) ||
          w.category?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (wordFilter === 'success') {
      filtered = filtered.filter((w) => w.finalSuccess);
    } else if (wordFilter === 'failed') {
      filtered = filtered.filter((w) => !w.finalSuccess);
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA = a[wordSortField];
      let valB = b[wordSortField];

      // Handle strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        return wordSortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      // Handle booleans
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        const numA = valA ? 1 : 0;
        const numB = valB ? 1 : 0;
        return wordSortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Handle numbers
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return wordSortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return filtered;
  }, [analytics, wordSearch, wordFilter, wordSortField, wordSortDirection]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-10 w-96 rounded bg-gray-200 animate-pulse" />
        <div className="h-5 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="h-12 w-full rounded-xl bg-gray-100 animate-pulse mt-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-red-100 bg-red-50 p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-red-900">Failed to load analytics</h2>
        <p className="mt-2 text-red-700">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Patient Profile
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const hasData = analytics.summary.totalSessions > 0;

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
        <div>
          <button
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Patient Profile
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Plan Performance Dashboard
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                analytics.planStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                analytics.planStatus === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                analytics.planStatus === 'Active' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {analytics.planStatus}
            </span>
            {/* Outcome scoring badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                analytics.summary.planOutcomeRating === 'Excellent' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                analytics.summary.planOutcomeRating === 'Good' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                analytics.summary.planOutcomeRating === 'Moderate' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              Outcome: {analytics.summary.planOutcomeRating} ({Math.round(analytics.summary.planOutcomeScore)}/100)
            </span>
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            Therapy plan details for <strong className="text-gray-800">{patientName}</strong> ·{' '}
            <span className="italic">{analytics.planDescription}</span>
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Started: {formatAnalyticsDate(analytics.startDate)}
            </span>
            {analytics.endDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Ended/Due: {formatAnalyticsDate(analytics.endDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <a
            href={`http://localhost:5246/api/doctors/${user?.id}/plans/${planId}/analytics/pdf-model`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" />
            PDF Export Data
          </a>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
          <Activity className="mx-auto mb-4 h-14 w-14 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900">No training session data found</h2>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            This therapy plan does not have any recorded training sessions or speech attempts yet. Analytics will become available once the patient completes training exercises.
          </p>
          <div className="mt-6">
            <Link
              to={`/doctor/patients/${patientId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Return to Patient File
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {[
                { id: 'summary', name: 'Plan Summary', icon: Activity },
                { id: 'words', name: 'Word Breakdown', icon: BookOpen },
                { id: 'categories', name: 'Category Analytics', icon: Layers },
                { id: 'strengths-weaknesses', name: 'Strengths & Weaknesses', icon: Award },
                { id: 'progress', name: 'Progress Delta', icon: TrendingUp },
                { id: 'insights', name: 'Clinical Insights', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-gray-900 text-gray-900 font-bold'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* 1. Total Session Duration */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Practice Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatDuration(analytics.summary.totalSessionDurationSeconds)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Sum of session intervals</p>
                  </div>
                </div>

                {/* 2. Total Words Practiced */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vocabulary Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.totalWordsPracticed}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Unique words attempted</p>
                  </div>
                </div>

                {/* 3. Total Speech Attempts */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Speech Attempts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.totalSpeechAttempts}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total vocal attempts</p>
                  </div>
                </div>

                {/* 4. Word Success Rate */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Word Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.wordSuccessRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Words mastered vs practiced</p>
                  </div>
                </div>

                {/* 5. Attempt Accuracy Rate */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Attempt Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.attemptAccuracyRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Correct tries vs total attempts</p>
                  </div>
                </div>

                {/* 6. First-Attempt Success Rate */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">First-Try Success</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.firstAttemptSuccessRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Mastery on initial trial</p>
                  </div>
                </div>

                {/* 7. Double Similarity Card (Attempt vs Mastered) */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4 col-span-1 md:col-span-2">
                  <div className="rounded-xl bg-pink-50 p-3 text-pink-600">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Phonetic Similarity</p>
                      <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase">Dual Metric</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-xs text-gray-400 block">Attempt Similarity</span>
                        <span className="text-xl font-bold text-gray-900">{Math.round(analytics.summary.averagePronunciationSimilarity)}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-semibold text-purple-700">Mastered Similarity</span>
                        <span className="text-xl font-bold text-purple-900">{Math.round(analytics.summary.masteredSimilarity)}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      <strong>Attempt Sim.</strong> averages all trials. <strong>Mastered Sim.</strong> averages only the highest score achieved per word, reflecting final speech capability.
                    </p>
                  </div>
                </div>

                {/* 8. Completed vs Failed */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-start gap-4">
                  <div className="rounded-xl bg-gray-50 p-3 text-gray-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Word Outcomes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.totalCompletedWords}{' '}
                      <span className="text-sm text-gray-400 font-normal">succeeded /</span>{' '}
                      <span className="text-red-500 font-bold">{analytics.summary.totalFailedWords}</span>{' '}
                      <span className="text-sm text-red-400 font-normal">failed</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Final mastery statuses</p>
                  </div>
                </div>
              </div>

              {/* General Plan Statistics Callout */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Training Engagement Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    The patient completed a total of <strong className="text-gray-900">{analytics.summary.totalSessions} sessions</strong>. On average, the patient made <strong className="text-gray-900">{(analytics.summary.totalSpeechAttempts / Math.max(1, analytics.summary.totalWordsPracticed)).toFixed(1)} attempts per word</strong>.
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Database Source</span>
                  <p className="text-sm font-bold text-gray-700">Unified Analytics Store</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORDS */}
          {activeTab === 'words' && (
            <div className="space-y-4 animate-fade-in">
              {/* Search & Filter Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by word, English, Arabic, or category..."
                    value={wordSearch}
                    onChange={(e) => setWordSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>Filter:</span>
                  </div>
                  <select
                    value={wordFilter}
                    onChange={(e) => setWordFilter(e.target.value as 'all' | 'success' | 'failed')}
                    className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  >
                    <option value="all">All Words</option>
                    <option value="success">Mastered (Succeeded)</option>
                    <option value="failed">Unmastered (Failed)</option>
                  </select>
                </div>
              </div>

              {/* Words Table */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 select-none">
                        <th className="px-6 py-4">Word Details</th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('category')}
                        >
                          Category {wordSortField === 'category' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('totalAttempts')}
                        >
                          Attempts {wordSortField === 'totalAttempts' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('bestSimilarityScore')}
                        >
                          Best Similarity {wordSortField === 'bestSimilarityScore' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('firstAttemptSuccess')}
                        >
                          First-Try {wordSortField === 'firstAttemptSuccess' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('finalSuccess')}
                        >
                          Status {wordSortField === 'finalSuccess' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => handleSort('timeSpentSeconds')}
                        >
                          Time Spent {wordSortField === 'timeSpentSeconds' && (wordSortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-4 text-center">History</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {processedWords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            No matching vocabulary items found.
                          </td>
                        </tr>
                      ) : (
                        processedWords.map((w) => {
                          const isExpanded = !!expandedWords[w.word];
                          return (
                            <React.Fragment key={w.word}>
                              <tr className="hover:bg-gray-50/50 text-sm text-gray-700 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-900 text-base">{w.word}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {w.wordArabic} / {w.wordEnglish}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                                    {w.category || 'Uncategorized'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{w.totalAttempts}</td>
                                <td className="px-6 py-4 font-semibold">
                                  <div className="flex items-center gap-2">
                                    <span>{Math.round(w.bestSimilarityScore)}%</span>
                                    <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                                      <div
                                        className={`h-full rounded-full ${
                                          w.bestSimilarityScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, w.bestSimilarityScore)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {w.firstAttemptSuccess ? (
                                    <Check className="h-5 w-5 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 stroke-[3]" />
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      w.finalSuccess
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {w.finalSuccess ? 'Success' : 'Failed'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                  {formatDuration(Math.round(w.timeSpentSeconds))}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => toggleWordExpanded(w.word)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1 text-xs"
                                    title={isExpanded ? 'Hide history' : 'Show attempt history'}
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    <span>{isExpanded ? 'Hide' : 'Tries'}</span>
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-gray-50/30">
                                  <td colSpan={8} className="px-8 py-4 border-l-2 border-gray-400">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                      Attempt-by-attempt Speech Recognition Logs
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                      {w.recognizedWordHistory.map((h) => (
                                        <div
                                          key={h.attemptNumber}
                                          className={`p-3 rounded-xl border bg-white flex flex-col justify-between shadow-xs ${
                                            h.isCorrect ? 'border-emerald-100' : 'border-gray-200'
                                          }`}
                                        >
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-gray-400">Try #{h.attemptNumber}</span>
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                h.isCorrect
                                                  ? 'bg-emerald-50 text-emerald-700'
                                                  : 'bg-red-50 text-red-700'
                                              }`}
                                            >
                                              {h.isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                          </div>
                                          <div className="my-2">
                                            <span className="text-xs text-gray-400 block">Recognized:</span>
                                            <strong className="text-sm text-gray-800 font-semibold italic break-words">
                                              {h.recognizedWord || '(silent)'}
                                            </strong>
                                          </div>
                                          <div className="flex items-center justify-between mt-1 text-xs border-t border-gray-100 pt-1.5">
                                            <span className="text-gray-500">Phonetic Score:</span>
                                            <strong className="text-gray-900 font-bold">{Math.round(h.similarityScore)}%</strong>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories Table */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-gray-500" />
                    Category Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          <th className="pb-3">Category</th>
                          <th className="pb-3 text-center">Words</th>
                          <th className="pb-3 text-center">Mastered</th>
                          <th className="pb-3">Accuracy</th>
                          <th className="pb-3">Avg Similarity</th>
                          <th className="pb-3 text-center">Attempts/Word</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {analytics.categories.map((c) => (
                          <tr key={c.category} className="hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-900 capitalize">{c.category}</td>
                            <td className="py-3 text-center font-medium">{c.wordsAttempted}</td>
                            <td className="py-3 text-center text-emerald-600 font-semibold">{c.wordsSucceeded}</td>
                            <td className="py-3 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                <span>{Math.round(c.accuracyPercent)}%</span>
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    c.accuracyPercent >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="py-3 font-medium">{Math.round(c.averageSimilarity)}%</td>
                            <td className="py-3 text-center text-gray-500 font-medium">{c.averageAttemptsPerWord.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Category Recharts Bar Chart */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Category Accuracy Rates</h3>
                    <p className="text-sm text-gray-500 mb-6">Percentage of successfully completed words in each category</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.categories}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} fontSize={11} />
                        <YAxis dataKey="category" type="category" fontSize={11} width={80} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [`${Math.round(Number(value))}%`, 'Mastery Rate']}
                        />
                        <Bar dataKey="accuracyPercent" radius={[0, 4, 4, 0]}>
                          {analytics.categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STRENGTHS & WEAKNESSES */}
          {activeTab === 'strengths-weaknesses' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Strengths Card */}
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <ThumbsUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Strength Analysis</h3>
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">High Performance Areas</p>
                  </div>
                </div>

                {/* Best Performing Categories */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Strong Categories (≥70% accuracy)</h4>
                  {analytics.strengths.bestPerformingCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No strong categories identified yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics.strengths.bestPerformingCategories.map((c) => (
                        <div key={c.category} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-2 flex items-center gap-2">
                          <span className="font-semibold text-emerald-900 capitalize text-sm">{c.category}</span>
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5">
                            {Math.round(c.accuracyPercent)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mastered on First Attempt */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Mastered on First Attempt</h4>
                  {analytics.strengths.masteredOnFirstAttempt.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No words were mastered on the first trial.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analytics.strengths.masteredOnFirstAttempt.map((w) => (
                        <div key={w.word} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">{w.word}</span>
                            <span className="text-xs text-gray-400 capitalize">{w.category || 'general'}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {Math.round(w.bestSimilarityScore)}% Sim
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Best Performing Words */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Top Performing Vocabulary</h4>
                  {analytics.strengths.bestPerformingWords.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No successfully completed words on record.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analytics.strengths.bestPerformingWords.slice(0, 6).map((w) => (
                        <div key={w.word} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">{w.word}</span>
                            <span className="text-xs text-gray-400">{w.totalAttempts} attempt(s)</span>
                          </div>
                          <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                            {Math.round(w.bestSimilarityScore)}% Best
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Weaknesses Card */}
              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-red-100 pb-4">
                  <div className="rounded-xl bg-red-50 p-2.5 text-red-500">
                    <ThumbsDown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Weakness Analysis</h3>
                    <p className="text-xs text-red-500 font-semibold uppercase tracking-wider mt-0.5">High Attention Needed</p>
                  </div>
                </div>

                {/* Failed Words */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Failed Vocabulary (Not Mastered)</h4>
                  {analytics.weaknesses.failedWords.length === 0 ? (
                    <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3 italic text-center font-medium">
                      All words practiced in this plan have been successfully completed!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analytics.weaknesses.failedWords.map((w) => (
                        <div key={w.word} className="rounded-lg border border-red-100 bg-red-50/30 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-red-950 block text-sm">{w.word}</span>
                            <span className="text-xs text-red-600 font-medium capitalize">{w.category || 'general'}</span>
                          </div>
                          <span className="text-xs font-bold text-red-700 bg-red-100/50 px-2 py-1 rounded">
                            {w.totalAttempts} tries
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* High Retry Words */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">High Retry Words (&gt;2 avg attempts)</h4>
                  {analytics.weaknesses.highRetryWords.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No high-retry vocabulary found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analytics.weaknesses.highRetryWords.slice(0, 6).map((w) => (
                        <div key={w.word} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">{w.word}</span>
                            <span className="text-xs text-gray-400 capitalize">{w.category || 'general'}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                            {w.totalAttempts} tries
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Low Similarity Words */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Low Pronunciation Similarity (&lt;70%)</h4>
                  {analytics.weaknesses.lowSimilarityWords.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No low-similarity vocabulary found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analytics.weaknesses.lowSimilarityWords.slice(0, 6).map((w) => (
                        <div key={w.word} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">{w.word}</span>
                            <span className="text-xs text-gray-400 capitalize">{w.category || 'general'}</span>
                          </div>
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                            {Math.round(w.bestSimilarityScore)}% Sim
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recurring Difficulties Section */}
                <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Recurring Difficulty Detection
                    </h4>
                    <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded">Therapist Flag</span>
                  </div>
                  {analytics.recurringDifficulties.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-4">No recurring difficulties flagged in this plan.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <th className="pb-2">Vocabulary Item</th>
                            <th className="pb-2">Category</th>
                            <th className="pb-2 text-center">Sessions Failed</th>
                            <th className="pb-2">Severity Score</th>
                            <th className="pb-2 text-center">Attention level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {analytics.recurringDifficulties.map((item) => (
                            <tr key={item.word} className="hover:bg-gray-50/50">
                              <td className="py-2.5 font-bold text-gray-900">{item.word}</td>
                              <td className="py-2.5 capitalize">{item.category || 'general'}</td>
                              <td className="py-2.5 text-center font-medium text-red-600">{item.frequency}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{Math.round(item.severityScore)}/100</span>
                                  <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.severityScore >= 75 ? 'bg-red-500' :
                                        item.severityScore >= 40 ? 'bg-amber-500' : 'bg-gray-400'
                                      }`}
                                      style={{ width: `${item.severityScore}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 text-center">
                                <span
                                  className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${
                                    item.attentionLevel === 'High' ? 'bg-red-100 text-red-800' :
                                    item.attentionLevel === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {item.attentionLevel}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROGRESS DELTA */}
          {activeTab === 'progress' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Development Comparison Timeline</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Compares the current plan's averages against previous training milestones and historical windows.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-4">Milestone Context</th>
                        <th className="px-6 py-4">Word Accuracy Delta</th>
                        <th className="px-6 py-4">Phonetic Similarity Delta</th>
                        <th className="px-6 py-4">First-Attempt Mastery Delta</th>
                        <th className="px-6 py-4 text-center font-bold">Data Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {[
                        {
                          name: 'Previous Session (within plan)',
                          ref: analytics.progressComparison.vsPreviousSession,
                        },
                        {
                          name: 'Previous Therapy Plan',
                          ref: analytics.progressComparison.vsPreviousPlan,
                        },
                        {
                          name: 'Last 7 Days (historical baseline)',
                          ref: analytics.progressComparison.vsLast7Days,
                        },
                        {
                          name: 'Last 30 Days (historical baseline)',
                          ref: analytics.progressComparison.vsLast30Days,
                        },
                      ].map((item) => (
                        <tr key={item.name} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{item.name}</td>
                          <td className="px-6 py-4">{renderDeltaCell(item.ref?.accuracyDelta, item.ref?.hasData, item.ref?.trendRating)}</td>
                          <td className="px-6 py-4">{renderDeltaCell(item.ref?.similarityDelta, item.ref?.hasData, item.ref?.trendRating)}</td>
                          <td className="px-6 py-4">{renderDeltaCell(item.ref?.firstAttemptDelta, item.ref?.hasData, item.ref?.trendRating)}</td>
                          <td className="px-6 py-4 text-center">
                            {item.ref?.hasData ? (
                              <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                                Active Comparison
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                                Insufficient Baseline
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm text-sm text-gray-600">
                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  Interpretation Note
                </h4>
                A positive percentage (e.g. <span className="text-emerald-600 font-bold">+5.3%</span>) indicates that the patient performed better in this plan than in the comparative window. Comparison baselines require at least one recorded training session outside the current scope during that period to show stats.
              </div>
            </div>
          )}

          {/* TAB 6: CLINICAL INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Clinical Analytics & Recommended Actions</h3>
                  <p className="text-sm text-gray-500">Structured evaluation computed from the training patterns</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                  {analytics.clinicalInsights.analysisSource === 'AI' || analytics.clinicalInsights.analysisSource === 'Ai' ? (
                    <>
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-800">AI Clinical Interpretation Layer</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Deterministic Engine (V1)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Clinical Summary
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {analytics.clinicalInsights.clinicalSummary || "No clinical summary could be determined."}
                </p>
              </div>

              {/* Suggested Next Content Card */}
              <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Clinical Guidelines & Next Therapy Recommendations
                  </h4>
                  <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">AI Recommendations</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Parameters advice */}
                  <div className="space-y-3 bg-blue-50/20 p-4 rounded-xl border border-blue-50">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Difficulty Target</span>
                      <span className="text-sm font-bold text-blue-900 block mt-1">{analytics.suggestedNextContent.difficultyAdjustment}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-100/50">
                      <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Recommended Exercises</span>
                      <span className="text-sm font-bold text-blue-900 block mt-1">{analytics.suggestedNextContent.recommendedExerciseCount} active exercise(s)</span>
                    </div>
                  </div>

                  {/* Reinforcement categories */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Categories to Reinforce</span>
                    {analytics.suggestedNextContent.categoriesNeedingReinforcement.length === 0 ? (
                      <p className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded font-medium">No category deficiencies flagged.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analytics.suggestedNextContent.categoriesNeedingReinforcement.map((c) => (
                          <span key={c} className="bg-red-50 text-red-700 rounded px-2.5 py-1 text-xs font-semibold border border-red-100 capitalize">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vocabulary repetition */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Vocabulary to Repeat</span>
                    {analytics.suggestedNextContent.vocabularyNeedingRepetition.length === 0 ? (
                      <p className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded font-medium">All practiced vocabulary successfully completed!</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {analytics.suggestedNextContent.vocabularyNeedingRepetition.map((w) => (
                          <span key={w} className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs font-medium">
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reasoning explanation */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2 text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-900 block mb-1">Clinical Reasoning:</strong>
                  {analytics.suggestedNextContent.reasoning}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Strengths Summary */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 shadow-sm space-y-3">
                  <h4 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-emerald-600" />
                    Observed Strengths
                  </h4>
                  <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1.5 pl-1">
                    {analytics.clinicalInsights.strengthAnalysis.map((str, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {str}
                      </li>
                    ))}
                    {analytics.clinicalInsights.strengthAnalysis.length === 0 && (
                      <li className="italic text-emerald-600/70">No specific strengths computed yet.</li>
                    )}
                  </ul>
                </div>

                {/* 2. Weaknesses Summary */}
                <div className="rounded-2xl border border-red-100 bg-red-50/20 p-6 shadow-sm space-y-3">
                  <h4 className="text-base font-bold text-red-950 flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                    Areas Requiring Practice
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-900 space-y-1.5 pl-1">
                    {analytics.clinicalInsights.weaknessAnalysis.map((wk, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {wk}
                      </li>
                    ))}
                    {analytics.clinicalInsights.weaknessAnalysis.length === 0 && (
                      <li className="italic text-red-600/70">No specific warnings triggered.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* 3. Recommended Focus Areas */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  Recommended Focus Areas (Priority Ordered)
                </h4>
                {analytics.clinicalInsights.suggestedFocusAreas.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No focus areas calculated.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.clinicalInsights.suggestedFocusAreas.map((item) => (
                      <div
                        key={item.area}
                        className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400">Priority #{item.priority}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 capitalize">
                              High Priority
                            </span>
                          </div>
                          <strong className="text-sm text-gray-900 capitalize block mb-1">{item.area}</strong>
                          <p className="text-xs text-gray-600 leading-relaxed">{item.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Suggested Exercises & Articulation Attention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-500" />
                    Treatment Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 pl-1">
                    {analytics.clinicalInsights.treatmentRecommendations.map((ex, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="bg-gray-100 text-gray-900 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{ex}</span>
                      </li>
                    ))}
                    {analytics.clinicalInsights.treatmentRecommendations.length === 0 && (
                      <li className="italic text-gray-500">No exercise recommendations recorded.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-500" />
                    Therapist Attention Flags
                  </h4>
                  <ul className="space-y-2.5 text-sm text-gray-700 pl-1">
                    {analytics.clinicalInsights.therapistNotes.map((att, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed bg-red-50/20 p-2.5 rounded-lg border border-red-50/50">
                        <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{att}</span>
                      </li>
                    ))}
                    {analytics.clinicalInsights.therapistNotes.length === 0 && (
                      <li className="italic text-gray-500">No flags raised. Phonetic matching meets baseline quality thresholds.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
