import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';
import type { PatientExerciseSessionAnalyticsDto } from '../../services/api/patient-exercises.api';

interface ExerciseFeedbackSummaryProps {
  sessionAnalytics: PatientExerciseSessionAnalyticsDto;
  onClose?: () => void;
}

export function ExerciseFeedbackSummary({
  sessionAnalytics,
  onClose,
}: ExerciseFeedbackSummaryProps) {
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());

  const { words, totalDurationSeconds, accuracyPercent, firstAttemptSuccessRate, averageSimilarityScore } =
    sessionAnalytics;

  const needsWorkWords = words
    .filter((w) => !w.succeeded || w.bestSimilarityScore < 70 || !w.firstAttemptCorrect)
    .sort((a, b) => a.bestSimilarityScore - b.bestSimilarityScore);

  const wellPerformedWords = words
    .filter((w) => w.succeeded && w.bestSimilarityScore >= 70 && w.firstAttemptCorrect)
    .sort((a, b) => b.bestSimilarityScore - a.bestSimilarityScore);

  const toggleExpanded = (vocabularyId: number) => {
    const next = new Set(expandedWords);
    if (next.has(vocabularyId)) next.delete(vocabularyId);
    else next.add(vocabularyId);
    setExpandedWords(next);
  };

  const wordKey = (w: { vocabularyId?: number; expectedWord: string }) =>
    w.vocabularyId ?? w.expectedWord;

  const minutes = Math.floor(totalDurationSeconds / 60);
  const seconds = totalDurationSeconds % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice Complete!</h1>
          <p className="text-gray-600">{sessionAnalytics.exerciseName} — session analytics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600">{Math.round(accuracyPercent)}%</div>
            <div className="text-sm text-gray-600 mt-1">Accuracy</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-indigo-600">{Math.round(firstAttemptSuccessRate)}%</div>
            <div className="text-sm text-gray-600 mt-1">First-Try Success</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600">{Math.round(averageSimilarityScore)}%</div>
            <div className="text-sm text-gray-600 mt-1">Avg Similarity</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-violet-600">{minutes}m {seconds}s</div>
            <div className="text-sm text-gray-600 mt-1">Session Time</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Word Performance
          </h2>
          <div className="space-y-2">
            {words.map((word) => (
              <div key={wordKey(word)} className="flex items-center gap-3 text-sm">
                <span className="w-28 truncate font-medium text-gray-800">{word.wordEnglish}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${word.succeeded ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${word.bestSimilarityScore}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-600">{word.totalAttempts}x</span>
                <span className="w-12 text-right font-semibold">{Math.round(word.bestSimilarityScore)}%</span>
                {word.firstAttemptCorrect ? (
                  <span className="text-emerald-600 text-xs">1st ✓</span>
                ) : (
                  <span className="text-amber-600 text-xs">retry</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {needsWorkWords.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-6 shadow-md border-2 border-amber-200 mb-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Focus Areas ({needsWorkWords.length} words)
            </h2>
            <div className="space-y-3">
              {needsWorkWords.map((word) => (
                <div
                  key={wordKey(word)}
                  className="bg-white rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => word.vocabularyId && toggleExpanded(word.vocabularyId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{word.wordEnglish}</p>
                      <p className="text-sm text-gray-600" dir="rtl">{word.wordArabic}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-700">{Math.round(word.bestSimilarityScore)}%</div>
                      <div className="text-xs text-gray-500">{word.totalAttempts} attempt(s)</div>
                      {word.vocabularyId && expandedWords.has(word.vocabularyId) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 mt-1 ml-auto" />
                      ) : word.vocabularyId ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 mt-1 ml-auto" />
                      ) : null}
                    </div>
                  </div>

                  {word.vocabularyId && expandedWords.has(word.vocabularyId) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      {word.attempts.map((attempt) => (
                        <div key={attempt.attemptNumber} className="text-xs text-gray-600 flex justify-between gap-2">
                          <span>#{attempt.attemptNumber}: "{attempt.recognizedWord || '—'}"</span>
                          <span className={attempt.isCorrect ? 'text-emerald-600' : 'text-amber-600'}>
                            {Math.round(attempt.similarityScore)}% · {attempt.audioDurationSeconds.toFixed(1)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {wellPerformedWords.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl p-6 shadow-md border-2 border-emerald-200 mb-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">
              Excellent Performance ({wellPerformedWords.length} words)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wellPerformedWords.map((word) => (
                <div key={wordKey(word)} className="bg-white rounded-xl p-4 border-l-4 border-emerald-500">
                  <p className="font-bold text-gray-900">{word.wordEnglish}</p>
                  <p className="text-sm text-gray-600 mb-2" dir="rtl">{word.wordArabic}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700">First try correct</span>
                    <span className="font-bold text-emerald-700">{Math.round(word.bestSimilarityScore)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-indigo-50 rounded-2xl p-6 shadow-md border-2 border-indigo-200 mb-6">
          <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Session Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>{sessionAnalytics.wordsCompleted} words · {sessionAnalytics.firstAttemptCorrectCount} correct on first try</p>
            {sessionAnalytics.strengthAreas.length > 0 && (
              <p>Strengths: {sessionAnalytics.strengthAreas.join(', ')}</p>
            )}
            {sessionAnalytics.weaknessAreas.length > 0 && (
              <p>Needs work: {sessionAnalytics.weaknessAreas.join(', ')}</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold hover:opacity-90 transition-all shadow-md"
        >
          Back to Plans
        </button>
      </div>
    </div>
  );
}
