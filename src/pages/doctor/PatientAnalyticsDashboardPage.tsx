import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getPatientLongitudinalAnalytics,
  type PatientLongitudinalAnalyticsDto,
} from '../../services/api/dashboard.api';
import { getPatientDetails } from '../../services/api/patients.api';
import {
  buildCategoryChartData,
  buildOverallChartData,
  formatAnalyticsDateTime,
  formatSessionDuration,
  formatTrendDelta,
  getTrendBadgeClass,
  summarizeCategoryTrends,
} from '../../utils/patientAnalyticsCharts';

function TrendIcon({ direction }: { direction: string }) {
  if (direction === 'Improving') return <TrendingUp className="h-5 w-5 text-emerald-600" />;
  if (direction === 'Declining') return <TrendingDown className="h-5 w-5 text-red-600" />;
  if (direction === 'Stable') return <Minus className="h-5 w-5 text-amber-600" />;
  return <BarChart3 className="h-5 w-5 text-gray-500" />;
}

export function PatientAnalyticsDashboardPage() {
  const { patientId: patientIdParam } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<PatientLongitudinalAnalyticsDto | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientId = patientIdParam ? parseInt(patientIdParam, 10) : NaN;

  const loadAnalytics = async () => {
    if (!user?.id || user.role !== 'doctor' || Number.isNaN(patientId)) {
      setError('Invalid patient or doctor session');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsData, patientData] = await Promise.all([
        getPatientLongitudinalAnalytics(user.id, patientId),
        getPatientDetails(user.id, patientId).catch(() => null),
      ]);

      setAnalytics(analyticsData);
      setPatientName(patientData?.name ?? `Patient #${patientId}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })
        ?.response?.status;
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;

      if (status === 403) {
        setError('You do not have access to this patient analytics.');
      } else if (status === 404) {
        setError('Patient analytics not found.');
      } else {
        setError(message ?? 'Failed to load patient analytics.');
      }
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user?.id, user?.role, patientId]);

  const overallChartData = useMemo(
    () => (analytics ? buildOverallChartData(analytics.sessionTimeline) : []),
    [analytics]
  );

  const categoryChart = useMemo(
    () => (analytics ? buildCategoryChartData(analytics.sessionTimeline) : { categories: [], data: [], colors: {} }),
    [analytics]
  );

  const categorySummary = useMemo(
    () => (analytics ? summarizeCategoryTrends(analytics.categoryTrends) : null),
    [analytics]
  );

  const averageOverallScore = useMemo(() => {
    if (!analytics || analytics.sessionTimeline.length === 0) return 0;
    const total = analytics.sessionTimeline.reduce((sum, session) => sum + session.overallScore, 0);
    return Math.round((total / analytics.sessionTimeline.length) * 10) / 10;
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-72 rounded-lg bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-80 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-600" />
        <h2 className="text-lg font-semibold text-red-900">Unable to load analytics</h2>
        <p className="mt-2 text-red-700">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/doctor/patients')}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            Back to patients
          </button>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const hasSessions = analytics.sessionTimeline.length > 0;
  const hasCategoryData = categoryChart.categories.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to patient
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Patient Progress Analytics</h1>
          <p className="mt-2 text-gray-600">
            Longitudinal training progress for {patientName}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {!hasSessions ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <LineChartIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">No training sessions yet</h2>
          <p className="mt-2 text-gray-600">
            Analytics will appear after the patient completes training sessions.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Overall Trend</p>
              <div className="mt-3 flex items-center gap-3">
                <TrendIcon direction={analytics.overallTrend.direction} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTrendDelta(analytics.overallTrend.delta)}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTrendBadgeClass(analytics.overallTrend.direction)}`}
                  >
                    {analytics.overallTrend.direction}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">{analytics.sessionTimeline.length}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Average Overall Score</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">{averageOverallScore}%</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Category Trends</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">
                  {categorySummary?.improving ?? 0} improving
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-800">
                  {categorySummary?.declining ?? 0} declining
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
                  {categorySummary?.stable ?? 0} stable
                </span>
              </div>
            </div>
          </section>

          {analytics.categoryTrends.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Category Insights</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {analytics.categoryTrends.map((trend) => (
                  <div
                    key={trend.category}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium capitalize text-gray-900">{trend.category}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTrendBadgeClass(trend.direction)}`}
                      >
                        {trend.direction}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {trend.firstSessionScore}% → {trend.lastSessionScore}%
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatTrendDelta(trend.delta)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Overall Score Over Sessions</h2>
              <p className="text-sm text-gray-600">Accuracy trend across completed training sessions</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const numeric = typeof value === 'number' ? value : Number(value);
                      return [`${numeric}%`, 'Overall Score'];
                    }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as { sessionLabel?: string; dateLabel?: string } | undefined;
                      return point ? `${point.sessionLabel} · ${point.dateLabel}` : '';
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#111827"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#111827' }}
                    activeDot={{ r: 6 }}
                    name="Overall Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Category Performance Over Time</h2>
              <p className="text-sm text-gray-600">
                Per-category accuracy across sessions (missing categories shown as gaps)
              </p>
            </div>
            {!hasCategoryData ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
                No category performance data recorded yet.
              </div>
            ) : (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={categoryChart.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const numeric = typeof value === 'number' ? value : Number(value);
                        if (Number.isNaN(numeric)) return ['—', String(name)];
                        return [`${numeric}%`, String(name)];
                      }}
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload as { sessionLabel?: string; dateLabel?: string } | undefined;
                        return point ? `${point.sessionLabel} · ${point.dateLabel}` : '';
                      }}
                    />
                    <Legend />
                    {categoryChart.categories.map((category) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={categoryChart.colors[category]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls={false}
                        name={category}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Session History</h2>
              <p className="text-sm text-gray-600">Chronological record of training sessions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Overall Score</th>
                    <th className="px-4 py-3">Categories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.sessionTimeline.map((session, index) => (
                    <tr key={session.trainingSessionId} className="text-sm text-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900">#{index + 1}</td>
                      <td className="px-4 py-3">{formatAnalyticsDateTime(session.startTime)}</td>
                      <td className="px-4 py-3">
                        {formatSessionDuration(session.startTime, session.endTime)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {session.overallScore}%
                      </td>
                      <td className="px-4 py-3">
                        {session.categoryScores.length === 0 ? (
                          <span className="text-gray-400">No categories</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {session.categoryScores.map((category) => (
                              <span
                                key={`${session.trainingSessionId}-${category.category}`}
                                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                              >
                                {category.category}: {category.accuracyPercent}%
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
