import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';
import type { RepetitionData } from '../../services/api/patient-exercises.api';

interface ExerciseFeedbackSummaryProps {
  allRepetitionData: RepetitionData[];
  vocabulary: { id: number; wordEnglish: string; wordArabic: string }[];
  totalDuration: number;
  overallAccuracy: number;
  onClose?: () => void;
}

interface WordPerformance {
  wordId: number;
  wordEnglish: string;
  wordArabic: string;
  averageAccuracy: number;
  attempts: number;
  firstTryCorrect: boolean;
  needsWork: boolean;
}

export function ExerciseFeedbackSummary({
  allRepetitionData,
  vocabulary,
  totalDuration,
  overallAccuracy,
  onClose,
}: ExerciseFeedbackSummaryProps) {
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());

  // Aggregate word performance across all repetitions
  const wordPerformance: WordPerformance[] = vocabulary.map(vocab => {
    let totalAttempts = 0;
    let firstTryCorrect = true;

    allRepetitionData.forEach(rep => {
      const wordData = rep.words.find(w => w.wordId === vocab.id);
      if (wordData) {
        totalAttempts += wordData.attempts;
        firstTryCorrect = firstTryCorrect && wordData.firstTryCorrect;
      }
    });

    // Calculate average accuracy (assuming 100% for words with successful attempts)
    const successfulAttempts = allRepetitionData.reduce((count, rep) => {
      const wordData = rep.words.find(w => w.wordId === vocab.id);
      return count + (wordData && wordData.attempts > 0 ? 1 : 0);
    }, 0);

    const averageAccuracy = successfulAttempts > 0 
      ? Math.round((successfulAttempts / allRepetitionData.length) * 100)
      : 0;

    return {
      wordId: vocab.id,
      wordEnglish: vocab.wordEnglish,
      wordArabic: vocab.wordArabic,
      averageAccuracy,
      attempts: totalAttempts,
      firstTryCorrect,
      needsWork: averageAccuracy < 70,
    };
  });

  // Sort by performance
  const needsWorkWords = wordPerformance.filter(w => w.needsWork).sort((a, b) => a.averageAccuracy - b.averageAccuracy);
  const wellPerformedWords = wordPerformance.filter(w => !w.needsWork).sort((a, b) => b.averageAccuracy - a.averageAccuracy);

  const toggleExpanded = (wordId: number) => {
    const newExpanded = new Set(expandedWords);
    if (newExpanded.has(wordId)) {
      newExpanded.delete(wordId);
    } else {
      newExpanded.add(wordId);
    }
    setExpandedWords(newExpanded);
  };

  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice Complete!</h1>
          <p className="text-gray-600">Here's your detailed performance summary</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600">{overallAccuracy}%</div>
            <div className="text-sm text-gray-600 mt-1">Overall Accuracy</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-indigo-600">{vocabulary.length}</div>
            <div className="text-sm text-gray-600 mt-1">Words Practiced</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600">{minutes}m {seconds}s</div>
            <div className="text-sm text-gray-600 mt-1">Total Time</div>
          </div>
        </div>

        {/* Performance by Round */}
        {allRepetitionData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance by Round
            </h2>
            <div className="space-y-2">
              {allRepetitionData.map((rep, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 w-16">Round {rep.repetitionNumber}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${rep.accuracyPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{rep.accuracyPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Words That Need Work */}
        {needsWorkWords.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-6 shadow-md border-2 border-amber-200 mb-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Focus Areas ({needsWorkWords.length} words)
            </h2>
            <div className="space-y-3">
              {needsWorkWords.map(word => (
                <div
                  key={word.wordId}
                  className="bg-white rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleExpanded(word.wordId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                          <p className="font-bold text-gray-900">{word.wordEnglish}</p>
                          <p className="text-sm text-gray-600" dir="rtl">{word.wordArabic}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-700">{word.averageAccuracy}%</div>
                      <div className="text-xs text-gray-500">{word.attempts} attempt(s)</div>
                      {expandedWords.has(word.wordId) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedWords.has(word.wordId) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Improvement Tips:</h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Practice this word multiple times</li>
                          <li>Listen carefully to the correct pronunciation</li>
                          <li>Slow down your speech and emphasize each sound</li>
                          {!word.firstTryCorrect && <li>This word took multiple attempts - focus on clarity</li>}
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                          💬 <strong>Speech Therapist Note:</strong> Pay special attention to the pronunciation of "{word.wordEnglish}". 
                          Try breaking it into syllables and practicing each part separately.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Well Performed Words */}
        {wellPerformedWords.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl p-6 shadow-md border-2 border-emerald-200 mb-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Excellent Performance ({wellPerformedWords.length} words)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wellPerformedWords.map(word => (
                <div
                  key={word.wordId}
                  className="bg-white rounded-xl p-4 border-l-4 border-emerald-500"
                >
                  <p className="font-bold text-gray-900">{word.wordEnglish}</p>
                  <p className="text-sm text-gray-600 mb-2" dir="rtl">{word.wordArabic}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700">Great job! 🌟</span>
                    <span className="font-bold text-emerald-700">{word.averageAccuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Feedback & Recommendations */}
        <div className="bg-indigo-50 rounded-2xl p-6 shadow-md border-2 border-indigo-200 mb-6">
          <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Personalized Feedback
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            {overallAccuracy >= 85 ? (
              <>
                <p>🌟 <strong>Excellent work!</strong> You showed great pronunciation skills in this session.</p>
                <p>✨ Your dedication to practicing these words is paying off. Keep up the great work!</p>
              </>
            ) : overallAccuracy >= 70 ? (
              <>
                <p>👍 <strong>Good progress!</strong> You're doing well with most words.</p>
                <p>💪 Focus on the highlighted words in the "Focus Areas" section and practice them a bit more.</p>
              </>
            ) : (
              <>
                <p>🎯 <strong>Keep practicing!</strong> Pronunciation takes time and effort.</p>
                <p>📚 Work with your speech therapist on the areas marked for improvement. You'll get better with consistent practice!</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold hover:opacity-90 transition-all shadow-md"
          >
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}
