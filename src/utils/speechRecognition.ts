/**
 * Speech Recognition Utility for Pronunciation Exercises
 * Handles speech-to-text conversion and word accuracy comparison
 */

// Initialize Web Speech API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface PronunciationFeedback {
  recognized: string;
  expected: string;
  accuracy: number;
  isCorrect: boolean;
  feedback: string;
}

interface DetailedPronunciationFeedback extends PronunciationFeedback {
  emphasis?: string[]; // Letters or sounds that need emphasis
  suggestions?: string[]; // Tips for improvement
  comparisonDetails?: { expected: string; actual: string; match: boolean }[];
}

/**
 * Normalize Arabic text by removing diacritics for better comparison
 */
function normalizeArabic(text: string): string {
  // Remove Arabic diacritics (tashkeel)
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritical marks
    .replace(/\u0640/g, '') // Remove tatweel
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 * Works with both Latin and Arabic text
 * Returns a value between 0 and 1 (0 = completely different, 1 = identical)
 */
function calculateStringSimilarity(str1: string, str2: string, isArabic: boolean = false): number {
  const s1 = isArabic ? normalizeArabic(str1).toLowerCase() : str1.toLowerCase().trim();
  const s2 = isArabic ? normalizeArabic(str2).toLowerCase() : str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Exact substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const editDistance = getLevenshteinDistance(shorter, longer);
  const maxDistance = longer.length;
  return 1 - editDistance / maxDistance;
}

function getLevenshteinDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Find character-level mismatches between expected and recognized text
 * Useful for highlighting pronunciation issues
 */
function findMismatches(expected: string, recognized: string): { position: number; expected: string; actual: string }[] {
  const mismatches: { position: number; expected: string; actual: string }[] = [];
  const maxLen = Math.max(expected.length, recognized.length);
  
  for (let i = 0; i < maxLen; i++) {
    const expChar = expected[i] || '';
    const recChar = recognized[i] || '';
    if (expChar !== recChar) {
      mismatches.push({ position: i, expected: expChar, actual: recChar });
    }
  }
  
  return mismatches;
}

/**
 * Generate emphasis suggestions based on character mismatches
 * Highlights letters or sounds that differ from expected pronunciation
 */
function generateEmphasisSuggestions(expected: string, recognized: string): string[] {
  const mismatches = findMismatches(expected, recognized);
  const suggestions: string[] = [];
  
  // Create emphasis hints for characters that don't match
  mismatches.forEach(mismatch => {
    if (mismatch.expected) {
      suggestions.push(`Pay attention to the letter "${mismatch.expected}" (you said "${mismatch.actual || 'nothing'}")`);
    }
  });
  
  return suggestions.slice(0, 3); // Limit to top 3 suggestions
}

/**
 * Generate improvement tips based on accuracy level
 */
function generateImprovementTips(accuracy: number, isArabic: boolean): string[] {
  const tips: string[] = [];
  
  if (accuracy < 40) {
    tips.push(isArabic ? 'استمع بعناية أكبر قبل التحدث' : 'Listen more carefully before speaking');
    tips.push(isArabic ? 'تأكد من نطق كل حرف بوضوح' : 'Make sure to pronounce each letter clearly');
  } else if (accuracy < 60) {
    tips.push(isArabic ? 'قم بتصحيح نطقك تدريجياً' : 'Gradually correct your pronunciation');
    tips.push(isArabic ? 'ركز على الأصوات المختلفة' : 'Focus on the different sounds');
  } else if (accuracy < 80) {
    tips.push(isArabic ? 'أنت قريب جداً! حاول مرة أخرى' : 'You\'re very close! Try again');
    tips.push(isArabic ? 'انتبه للتفاصيل الصغيرة' : 'Pay attention to small details');
  }
  
  return tips;
}

/**
 * Evaluate pronunciation based on recognized text
 * Supports both Arabic and English
 * Uses configurable accuracy threshold (default 70%)
 */
export function evaluatePronunciation(
  recognizedText: string,
  expectedWord: string,
  expectedArabic?: string,
  isArabic: boolean = false,
  accuracyThreshold: number = 0.7
): PronunciationFeedback {
  if (!recognizedText.trim()) {
    return {
      recognized: '',
      expected: expectedWord,
      accuracy: 0,
      isCorrect: false,
      feedback: '🔴 لم يتم التقاط الصوت. يرجى المحاولة مرة أخرى. (No speech detected)',
    };
  }

  // Use Arabic comparison if Arabic text is provided
  let similarity = 0;
  let displayExpected = expectedWord;

  if (isArabic && expectedArabic) {
    similarity = calculateStringSimilarity(recognizedText, expectedArabic, true);
    displayExpected = expectedArabic;
  } else {
    similarity = calculateStringSimilarity(recognizedText, expectedWord, false);
  }

  const accuracyPercent = Math.round(similarity * 100);

  if (similarity >= accuracyThreshold) {
    return {
      recognized: recognizedText,
      expected: displayExpected,
      accuracy: accuracyPercent,
      isCorrect: true,
      feedback: `✅ ممتاز! نطقت "${recognizedText}" بشكل صحيح! (Accuracy: ${accuracyPercent}%)`,
    };
  } else if (similarity >= 0.5) {
    return {
      recognized: recognizedText,
      expected: displayExpected,
      accuracy: accuracyPercent,
      isCorrect: false,
      feedback: `⚠️ قريب جداً! قلت "${recognizedText}", لكننا توقعنا "${displayExpected}" (Accuracy: ${accuracyPercent}%)`,
    };
  } else {
    return {
      recognized: recognizedText,
      expected: displayExpected,
      accuracy: accuracyPercent,
      isCorrect: false,
      feedback: `❌ ليس تماماً. قلت "${recognizedText}"، لكننا توقعنا "${displayExpected}" (Accuracy: ${accuracyPercent}%)`,
    };
  }
}

/**
 * Generate detailed pronunciation feedback with emphasis and improvement tips
 */
export function generateDetailedFeedback(
  recognizedText: string,
  expectedWord: string,
  expectedArabic?: string,
  isArabic: boolean = false,
  accuracyThreshold: number = 0.7
): DetailedPronunciationFeedback {
  const baseFeedback = evaluatePronunciation(
    recognizedText,
    expectedWord,
    expectedArabic,
    isArabic,
    accuracyThreshold
  );

  const displayExpected = isArabic && expectedArabic ? expectedArabic : expectedWord;
  const emphasis = !baseFeedback.isCorrect 
    ? generateEmphasisSuggestions(
        normalizeArabic(displayExpected),
        normalizeArabic(recognizedText)
      )
    : [];

  const suggestions = generateImprovementTips(baseFeedback.accuracy, isArabic);

  return {
    ...baseFeedback,
    emphasis,
    suggestions,
  };
}

/**
 * Start speech recognition
 * Returns a promise that resolves with the recognized text
 * @param language Language code (e.g., 'ar-EG' for Arabic, 'en-US' for English)
 */
export function startSpeechRecognition(language: string = 'ar-EG'): Promise<RecognitionResult> {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) {
      reject(new Error('Speech Recognition API not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.language = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let finalConfidence = 0;

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript = transcript;
          finalConfidence = confidence;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        resolve({
          transcript: finalTranscript,
          confidence: finalConfidence,
          isFinal: true,
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        reject(new Error('No speech detected. Please try again.'));
      } else if (event.error === 'network') {
        reject(new Error('Network error. Please check your connection.'));
      } else {
        reject(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      if (finalTranscript) {
        resolve({
          transcript: finalTranscript,
          confidence: finalConfidence,
          isFinal: true,
        });
      } else {
        reject(new Error('Speech recognition ended without capturing audio'));
      }
    };

    recognition.start();
  });
}

/**
 * Check if browser supports Web Speech API
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!SpeechRecognition;
}
