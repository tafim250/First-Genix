import { Question, HSKLevel } from './types';

export const evaluateWriting = (userAnswer: string, modelAnswer: string, maxMarks: number): { score: number; comment: string } => {
  if (!userAnswer || userAnswer.trim() === '') {
    return { score: 0, comment: 'No answer provided.' };
  }

  const userWords = userAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const modelWords = modelAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  // Keyword matching
  const commonWords = userWords.filter(w => modelWords.includes(w));
  const keywordScore = (commonWords.length / modelWords.length) * 0.6; // 60% weight

  // Length comparison
  const lengthRatio = Math.min(userWords.length / modelWords.length, 1);
  const lengthScore = lengthRatio * 0.2; // 20% weight

  // Basic similarity (Jaccard)
  const uniqueUserWords = new Set(userWords);
  const uniqueModelWords = new Set(modelWords);
  const intersection = new Set([...uniqueUserWords].filter(x => uniqueModelWords.has(x)));
  const union = new Set([...uniqueUserWords, ...uniqueModelWords]);
  const similarityScore = (intersection.size / union.size) * 0.2; // 20% weight

  const totalScore = (keywordScore + lengthScore + similarityScore) * maxMarks;
  const finalScore = Math.min(Math.round(totalScore), maxMarks);

  let comment = 'Good effort!';
  if (finalScore >= maxMarks * 0.8) comment = 'Excellent! Very close to the model answer.';
  else if (finalScore >= maxMarks * 0.5) comment = 'Average. Try to include more keywords.';
  else comment = 'Needs improvement. Focus on the core vocabulary.';

  return { score: finalScore, comment };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const speakText = (text: string, level: HSKLevel = 1) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  
  // Adjust speed based on level
  // HSK 1-2: slow (0.7-0.8)
  // HSK 3-4: normal (0.9-1.0)
  // HSK 5-6: native (1.1-1.2)
  if (level <= 2) utterance.rate = 0.75;
  else if (level <= 4) utterance.rate = 0.95;
  else utterance.rate = 1.15;

  // Try to find a female Chinese voice
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh') && v.name.toLowerCase().includes('female')) || 
                  voices.find(v => v.lang.includes('zh'));
  
  if (zhVoice) utterance.voice = zhVoice;

  window.speechSynthesis.speak(utterance);
};
