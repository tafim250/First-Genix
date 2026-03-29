import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, Play, Info, BookOpen, PenTool, Headphones, GraduationCap, LayoutGrid } from 'lucide-react';
import { Exam, Question, ExamResult, SectionType } from '../types';
import { evaluateWriting, formatTime, speakText } from '../utils';
import { HSK_PASS_THRESHOLDS } from '../constants';
import { saveResult } from '../db';
import { motion, AnimatePresence } from 'motion/react';

interface ExamInterfaceProps {
  exam: Exam;
  user: any;
  onClose: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({ exam, user, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [playedAudio, setPlayedAudio] = useState<Set<string>>(new Set());

  const currentQuestion = exam.questions[currentQuestionIndex];

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;
    setIsEvaluating(true);
    
    let totalScore = 0;
    const sectionScores: Record<SectionType, number> = { Listening: 0, Reading: 0, Writing: 0 };
    const feedback: Record<string, { score: number; comment: string }> = {};

    for (const q of exam.questions) {
      const userAnswer = answers[q.id];
      let qScore = 0;

      if (q.type === 'MCQ' || q.type === 'Listening' || q.type === 'True/False') {
        if (q.section === 'Reading') {
          // Handle specialized Reading parts (HSK 3-6)
          if (q.optionPool && q.blankMapping) {
            // Multiple Blanks with Option Pool (HSK 4 Part II, HSK 6 Part III)
            const userAnswers = userAnswer || {};
            let correctCount = 0;
            const totalBlanks = Object.keys(q.blankMapping).length;
            Object.entries(q.blankMapping).forEach(([bIdx, correctVal]) => {
              if (userAnswers[bIdx] === correctVal) correctCount++;
            });
            qScore = totalBlanks > 0 ? (correctCount / totalBlanks) * q.maxMarks : 0;
          } else if (q.blanks && q.blanks.length > 0) {
            // Passage with Sub-questions or Fill in Blanks (HSK 3-6)
            const userAnswers = userAnswer || {};
            let correctCount = 0;
            q.blanks.forEach((blank, bIdx) => {
              if (userAnswers[bIdx] === blank.correctAnswer) correctCount++;
            });
            qScore = (correctCount / q.blanks.length) * q.maxMarks;
          } else {
            // Standard MCQ or Error Detection (HSK 6 Part I)
            if (userAnswer === q.correctAnswer) qScore = q.maxMarks;
          }
        } else {
          if (userAnswer === q.correctAnswer) {
            qScore = q.maxMarks;
          }
        }
      } else if (q.type === 'Writing') {
        const evalResult = evaluateWriting(userAnswer || '', q.modelAnswer || '', q.maxMarks);
        qScore = evalResult.score;
        feedback[q.id] = evalResult;
      }

      totalScore += qScore;
      sectionScores[q.section] += qScore;
    }

    const passed = exam.level 
      ? totalScore >= HSK_PASS_THRESHOLDS[exam.level] 
      : totalScore >= (exam.totalMarks * 0.6);

    const examResult: ExamResult = {
      id: `res-${Date.now()}`,
      userId: user?.uid || '',
      examId: exam.id,
      examName: exam.name,
      level: exam.level,
      score: totalScore,
      sectionScores,
      totalMarks: exam.totalMarks,
      passed,
      date: Date.now(),
      answers,
      feedback,
    };

    await saveResult(examResult);
    setResult(examResult);
    setIsSubmitted(true);
    setIsEvaluating(false);
  }, [answers, exam, isSubmitted, user?.uid]);

  useEffect(() => {
    // Auto-play audio for listening questions if not played yet
    if (currentQuestion.type === 'Listening' && !playedAudio.has(currentQuestion.id) && !isSubmitted) {
      const timer = setTimeout(() => {
        handlePlayAudio(currentQuestion);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion.id, currentQuestion.type, isSubmitted]);

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, handleSubmit]);

  const handleAnswer = (questionId: string, answer: any, blankIndex?: number) => {
    if (blankIndex !== undefined) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...(prev[questionId] || {}),
          [blankIndex]: answer
        }
      }));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    }
  };

  const handlePlayAudio = (q: Question) => {
    if (playedAudio.has(q.id)) return;
    if (q.audioUrl) {
      const audio = new Audio(q.audioUrl);
      audio.play().catch(e => {
        console.error("Audio playback failed, falling back to TTS", e);
        speakText(q.audioScript || q.text, exam.level);
      });
    } else {
      speakText(q.audioScript || q.text, exam.level);
    }
    setPlayedAudio(prev => new Set([...prev, q.id]));
  };

  if (isSubmitted && result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className={`p-12 text-center text-white ${result.passed ? 'bg-green-600' : 'bg-red-600'} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter">Exam Result</h2>
            <p className="text-xl font-bold opacity-80">{exam.name}</p>
          </motion.div>
        </div>
        <div className="p-12 space-y-12">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Score</p>
              <p className="text-4xl font-black text-gray-900">{result.score}/{result.totalMarks}</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Percentage</p>
              <p className="text-4xl font-black text-gray-900">{Math.round((result.score / result.totalMarks) * 100)}%</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status</p>
              <p className={`text-4xl font-black ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {Object.entries(result.sectionScores).map(([section, score]) => (
              exam.sectionDurations[section as SectionType] > 0 && (
                <div key={section} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{section}</p>
                  <p className="text-lg font-bold text-blue-900">{score} Marks</p>
                </div>
              )
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Info className="w-6 h-6 text-blue-600" />
              AI Writing Feedback
            </h3>
            <div className="space-y-4">
              {Object.entries(result.feedback).map(([qId, fb]) => {
                const q = exam.questions.find(q => q.id === qId);
                const feedback = fb as { score: number; comment: string };
                return (
                  <div key={qId} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
                      W
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-1">{q?.text}</p>
                      <p className="text-xs text-gray-500 font-medium mb-3 italic">"Your answer: {result.answers[qId]}"</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-600">{feedback.comment}</p>
                        <span className="text-xs font-black bg-blue-100 px-3 py-1 rounded-full text-blue-600">
                          {feedback.score}/{q?.maxMarks} Marks
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-[#0A192F] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 min-h-[750px] flex flex-col">
      <div className="bg-[#0A192F] text-white p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 flex-shrink-0">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-black tracking-tight truncate">{exam.name}</h2>
            <p className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-widest">
              {currentQuestion.section} Section • Question {currentQuestionIndex + 1} of {exam.questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowPalette(!showPalette)}
            className="p-2 md:p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-3 md:gap-4 bg-white/10 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/10">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            <span className={`text-lg md:text-xl font-black font-mono ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showPalette && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            className="border-r border-gray-100 bg-gray-50 overflow-y-auto p-6"
          >
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                    i === currentQuestionIndex ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                    answers[q.id] ? 'bg-green-100 text-green-600 border border-green-200' :
                    'bg-white text-gray-400 border border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}        <div className="flex-1 p-6 md:p-12 flex flex-col overflow-y-auto">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 md:space-y-10"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex-shrink-0 ${
                    currentQuestion.type === 'Listening' ? 'bg-purple-50 text-purple-600' :
                    currentQuestion.type === 'Writing' ? 'bg-orange-50 text-orange-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {currentQuestion.type === 'Listening' ? <Headphones className="w-6 h-6 md:w-8 md:h-8" /> :
                     currentQuestion.type === 'Writing' ? <PenTool className="w-6 h-6 md:w-8 md:h-8" /> :
                     <BookOpen className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <div>
                    <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">{currentQuestion.type} Section</span>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{currentQuestion.text}</h3>
                    {currentQuestion.imageUrl && (
                      <div className="mt-6 rounded-3xl overflow-hidden border-4 border-gray-50 shadow-sm max-w-2xl">
                        <img 
                          src={currentQuestion.imageUrl} 
                          alt="Question Visual" 
                          className="w-full h-auto object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {currentQuestion.type === 'Listening' && (
                  <div className="bg-purple-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-purple-100 flex flex-col items-center gap-4 md:gap-6">
                    <button 
                      disabled={playedAudio.has(currentQuestion.id)}
                      onClick={() => handlePlayAudio(currentQuestion)}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                        playedAudio.has(currentQuestion.id) 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-purple-600 text-white hover:scale-110 shadow-purple-200'
                      }`}
                    >
                      <Play className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                    </button>
                    <p className="text-purple-900 font-bold text-sm md:text-base text-center">
                      {playedAudio.has(currentQuestion.id) ? 'Audio clip finished' : 'Audio playing automatically...'}
                    </p>
                  </div>
                )}

                <div className="space-y-4 md:space-y-6">
                  {currentQuestion.type === 'Writing' ? (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here in Chinese..."
                      className="w-full h-48 md:h-64 p-6 md:p-8 bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 text-base md:text-lg font-medium transition-all resize-none"
                    />
                  ) : currentQuestion.section === 'Reading' && currentQuestion.optionPool && currentQuestion.blankMapping ? (
                    // HSK 4 Part II / HSK 6 Part III: Fill in the Blank (Multiple Blanks with Option Pool)
                    <div className="space-y-8">
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex flex-wrap gap-3 mb-6">
                          {currentQuestion.optionPool?.map((option, idx) => (
                            <div key={idx} className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-blue-600 shadow-sm">
                              {String.fromCharCode(65 + idx)}: {option}
                            </div>
                          ))}
                        </div>
                        <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                          {currentQuestion.text.split(/(\(\d+\))/).map((part, i) => {
                            const match = part.match(/\((\d+)\)/);
                            if (match) {
                              const blankIdx = parseInt(match[1]);
                              return (
                                <select
                                  key={i}
                                  value={answers[currentQuestion.id]?.[blankIdx] || ''}
                                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value, blankIdx)}
                                  className="mx-2 px-3 py-1 bg-white border-2 border-blue-100 rounded-lg font-bold text-blue-600 focus:border-blue-600 outline-none"
                                >
                                  <option value="">Select</option>
                                  {currentQuestion.optionPool?.map((_, idx) => (
                                    <option key={idx} value={String.fromCharCode(65 + idx)}>
                                      {String.fromCharCode(65 + idx)}
                                    </option>
                                  ))}
                                </select>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                  ) : currentQuestion.section === 'Reading' && currentQuestion.blanks && currentQuestion.blanks.length > 0 ? (
                    // HSK 3-6 Reading: Passage with Sub-questions or Fill in Blanks
                    <div className="space-y-8">
                      <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {currentQuestion.text}
                      </div>
                      <div className="space-y-10">
                        {currentQuestion.blanks?.map((blank, bIdx) => (
                          <div key={bIdx} className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 flex gap-3">
                              <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm flex-shrink-0">{bIdx + 1}</span>
                              {blank.question || `Blank ${bIdx + 1}`}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {blank.options.map((option, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswer(currentQuestion.id, String.fromCharCode(65 + oIdx), bIdx)}
                                  className={`p-4 text-left rounded-xl border-2 transition-all font-bold ${
                                    answers[currentQuestion.id]?.[bIdx] === String.fromCharCode(65 + oIdx)
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                      : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                                  }`}
                                >
                                  <span className="mr-3 opacity-50">{String.fromCharCode(65 + oIdx)}.</span>
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${currentQuestion.type === 'True/False' ? 'grid-cols-2' : currentQuestion.optionImages ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                      {currentQuestion.options?.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={`p-4 md:p-6 text-left rounded-xl md:rounded-2xl border-2 transition-all duration-200 flex flex-col gap-3 md:gap-4 group ${
                            answers[currentQuestion.id] === option
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200'
                              : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-sm flex-shrink-0 ${
                              answers[currentQuestion.id] === option ? 'bg-white/20' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}>
                              {currentQuestion.type === 'True/False' ? (i === 0 ? 'T' : 'F') : String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-sm md:text-lg font-bold flex-1">
                              {currentQuestion.optionImages ? '' : option}
                            </span>
                          </div>
                          {currentQuestion.optionImages?.[i] && (
                            <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-100 mt-2">
                              <img 
                                src={currentQuestion.optionImages[i]} 
                                alt={`Option ${String.fromCharCode(65 + i)}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 text-gray-400 font-bold hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Previous
              </button>
              
              <div className="md:hidden text-xs font-black text-gray-400">
                {currentQuestionIndex + 1} / {exam.questions.length}
              </div>
            </div>
            
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isEvaluating}
                className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3"
              >
                {isEvaluating ? 'Evaluating...' : 'Submit Exam'} <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
              >
                Next Question <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
