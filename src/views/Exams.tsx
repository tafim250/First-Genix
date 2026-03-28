import React, { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, Clock, BookOpen, CheckCircle, Info, PlayCircle } from 'lucide-react';
import { HSKLevel, Exam } from '../types';
import { HSK_DURATIONS, HSK_TOTAL_MARKS } from '../constants';
import { getUserResults } from '../db';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface ExamsProps {
  user: any;
  onStartExam: (exam: Exam) => void;
}

export const Exams: React.FC<ExamsProps> = ({ user, onStartExam }) => {
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [completedExams, setCompletedExams] = useState<string[]>([]);
  const [hskExams, setHskExams] = useState<Exam[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const results = await getUserResults(user.uid);
        setCompletedExams(results.map(r => r.examId));
      }
      if (selectedLevel) {
        // Fetch custom exams from Firestore
        let customExams: Exam[] = [];
        try {
          const q = query(collection(db, 'hsk_exams'), where('level', '==', selectedLevel));
          const querySnapshot = await getDocs(q);
          customExams = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Exam));
        } catch (error) {
          console.error('Error fetching custom exams:', error);
        }

        setHskExams(customExams);
      }
    };
    fetchData();
  }, [user, selectedLevel]);

  const levels: HSKLevel[] = [1, 2, 3, 4, 5, 6];

  const handleBack = () => {
    if (selectedExam) setSelectedExam(null);
    else setSelectedLevel(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {selectedExam ? 'Test Instructions' : selectedLevel ? `HSK Level ${selectedLevel} Mock Tests` : 'HSK Mock Tests'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {selectedExam ? 'Please read the instructions carefully before starting.' : 'Select your level and start practicing for the official HSK exam.'}
          </p>
        </div>
        {(selectedLevel || selectedExam) && (
          <button 
            onClick={handleBack}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedLevel ? (
          <div className="space-y-12">
            <motion.div 
              key="levels"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {levels.map((level) => (
                <motion.div
                  key={level}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedLevel(level)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">HSK Level {level}</h3>
                    <p className="text-gray-400 font-medium mb-6">Master HSK {level} vocabulary and grammar with official-timed mock tests.</p>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-gray-600">{HSK_DURATIONS[level]} Min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-600">{HSK_TOTAL_MARKS[level]} Marks</span>
                      </div>
                    </div>
                    <button className="w-full py-4 bg-gray-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                      View Mock Tests <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black">Official HSK Resources</h3>
                </div>
                <p className="text-blue-200 font-medium max-w-2xl">
                  For official past papers and real audio recordings, we recommend visiting these trusted platforms. You can use these to supplement your practice on FirstGenix.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  <a href="https://www.thatsmandarin.com/hsk-level-practice-tests-downloads-audio-pdfs-and-placement-tests/" target="_blank" rel="noreferrer" className="p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">That's Mandarin (Audio & PDFs)</span>
                  </a>
                  <a href="https://www.digmandarin.com/hsk-mock-test-online.html" target="_blank" rel="noreferrer" className="p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">DigMandarin (Online Mock)</span>
                  </a>
                  <a href="https://www.chinesetest.cn" target="_blank" rel="noreferrer" className="p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">ChineseTest.cn (Official)</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : !selectedExam ? (
          <motion.div
            key="mock-tests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hskExams.map((exam, i) => (
              <motion.div
                key={exam.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl font-black text-sm">
                    #{i + 1}
                  </div>
                  {completedExams.includes(exam.id) ? (
                    <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Completed</span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">New</span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">{exam.name}</h4>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                    <span className="text-sm font-bold text-gray-700">{exam.duration} Minutes</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions</span>
                    <span className="text-sm font-bold text-gray-700">{exam.questions.length} Items</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedExam(exam)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  View Instructions
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-3xl mx-auto"
          >
            <div className="p-12 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-100">
                  <Info className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">{selectedExam.name}</h2>
                <p className="text-gray-500 font-medium">Official HSK Structure & Timing</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {Object.entries(selectedExam.sectionDurations).map(([section, duration]) => (
                  (duration as number) > 0 && (
                    <div key={section} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{section}</p>
                      <p className="text-lg font-bold text-gray-900">{duration as number} Min</p>
                    </div>
                  )
                ))}
              </div>

              <div className="space-y-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" /> Important Notes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside font-medium">
                  <li>The test will automatically submit when the timer reaches zero.</li>
                  <li>You can navigate between questions using the palette.</li>
                  <li>Listening audio can be played once per question.</li>
                  <li>Writing section for Level 4-6 is AI-evaluated.</li>
                </ul>
              </div>

              <button 
                onClick={() => onStartExam(selectedExam)}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
              >
                Start Test Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
