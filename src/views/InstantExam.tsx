import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Upload, FileJson, Clock, BookOpen, UserCheck, ArrowRight, Music, ImageIcon } from 'lucide-react';
import { Exam, Question, QuestionType, HSKLevel, SectionType } from '../types';
import { saveInstantExam, getInstantExams } from '../db';
import { motion, AnimatePresence } from 'motion/react';

interface InstantExamProps {
  user: any;
  onStartExam: (exam: Exam) => void;
}

export const InstantExam: React.FC<InstantExamProps> = ({ user, onStartExam }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    name: '',
    level: 1,
    duration: 60,
    totalMarks: 100,
    questions: [],
    isInstant: true,
    createdBy: user?.uid || '',
    scheduledTime: undefined,
  });

  const ADMIN_EMAILS = [
    'mdtafim77889@gmail.com',
    'tafim160@gmail.com',
    'tafimgood@gmail.com'
  ];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    const fetchExams = async () => {
      const all = await getInstantExams();
      setExams(all);
      
      // Auto-start logic for scheduled exams
      const scheduled = all.find(e => e.scheduledTime && e.scheduledTime <= Date.now() && e.scheduledTime > Date.now() - (e.duration * 60 * 1000));
      if (scheduled && !isAdmin) {
        onStartExam(scheduled);
      }
    };
    fetchExams();
    const interval = setInterval(fetchExams, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const addQuestion = () => {
    const q: Question = {
      id: `q-${Date.now()}`,
      type: 'MCQ',
      section: 'Listening',
      level: newExam.level as HSKLevel,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 'A',
      maxMarks: 2,
    };
    setNewExam(prev => ({ ...prev, questions: [...(prev.questions || []), q] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number, type: 'audio' | 'image' | 'optionImage', optionIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('File size too large. Please keep it under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updated = [...(newExam.questions || [])];
      
      if (type === 'audio') {
        updated[index].audioUrl = base64String;
      } else if (type === 'image') {
        updated[index].imageUrl = base64String;
      } else if (type === 'optionImage' && optionIndex !== undefined) {
        if (!updated[index].optionImages) {
          updated[index].optionImages = [];
        }
        updated[index].optionImages![optionIndex] = base64String;
      }
      
      setNewExam(prev => ({ ...prev, questions: updated }));
    };
    reader.readAsDataURL(file);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...(newExam.questions || [])];
    updated[index] = { ...updated[index], ...updates };
    setNewExam(prev => ({ ...prev, questions: updated }));
  };

  const addBlank = (qIndex: number) => {
    const updated = [...(newExam.questions || [])];
    if (!updated[qIndex].blanks) updated[qIndex].blanks = [];
    updated[qIndex].blanks!.push({ options: ['', '', '', ''], correctAnswer: 'A' });
    setNewExam(prev => ({ ...prev, questions: updated }));
  };

  const removeBlank = (qIndex: number, bIndex: number) => {
    const updated = [...(newExam.questions || [])];
    updated[qIndex].blanks = updated[qIndex].blanks!.filter((_, i) => i !== bIndex);
    setNewExam(prev => ({ ...prev, questions: updated }));
  };

  const updateBlank = (qIndex: number, bIndex: number, field: string, value: any) => {
    const updated = [...(newExam.questions || [])];
    if (updated[qIndex].blanks && updated[qIndex].blanks![bIndex]) {
      (updated[qIndex].blanks![bIndex] as any)[field] = value;
      setNewExam(prev => ({ ...prev, questions: updated }));
    }
  };

  const handleSave = async () => {
    if (!newExam.name || !newExam.questions?.length) {
      alert('Please fill in all fields and add at least one question.');
      return;
    }

    const level = newExam.level || 1;
    const duration = newExam.duration || 60;

    const exam: Exam = {
      ...newExam as Exam,
      id: `instant-${Date.now()}`,
      sectionDurations: {
        Listening: level <= 2 ? Math.floor(duration * 0.5) : Math.floor(duration * 0.35),
        Reading: level <= 2 ? Math.floor(duration * 0.5) : Math.floor(duration * 0.35),
        Writing: level <= 2 ? 0 : Math.floor(duration * 0.3),
      },
      totalMarks: newExam.questions?.reduce((acc, q) => acc + (q.maxMarks || 0), 0) || 0,
    };

    await saveInstantExam(exam);
    setExams(prev => [...prev, exam]);
    setIsCreating(false);
    setNewExam({
      name: '',
      level: 1,
      duration: 60,
      totalMarks: 100,
      questions: [],
      isInstant: true,
      createdBy: user?.uid || '',
    });
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setNewExam(prev => ({ ...prev, ...json, isInstant: true, createdBy: user?.uid || '' }));
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Instant Exams</h1>
          <p className="text-gray-500 font-medium mt-1">Custom exams created by administrators for quick practice.</p>
        </div>
        {isAdmin && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" /> Create Exam
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-gray-900">New Instant Exam</h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all">
                  <FileJson className="w-4 h-4" /> Import JSON
                  <input type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
                </label>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-400 font-bold hover:text-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Exam Name</label>
                  <input 
                    type="text" 
                    value={newExam.name}
                    onChange={(e) => setNewExam(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                    placeholder="e.g., Weekly HSK Review"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">HSK Level</label>
                  <select 
                    value={newExam.level}
                    onChange={(e) => {
                      const level = parseInt(e.target.value) as HSKLevel;
                      setNewExam(prev => ({ 
                        ...prev, 
                        level,
                        questions: prev.questions?.map(q => ({ ...q, level })) || []
                      }));
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Duration (Min)</label>
                  <input 
                    type="number" 
                    value={newExam.duration}
                    onChange={(e) => setNewExam(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Marks</label>
                  <input 
                    type="number" 
                    value={newExam.totalMarks}
                    onChange={(e) => setNewExam(prev => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    onChange={(e) => setNewExam(prev => ({ ...prev, scheduledTime: new Date(e.target.value).getTime() }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" /> Questions
                  </h3>
                  <button 
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {newExam.questions?.map((q, i) => (
                    <div key={q.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative group">
                      <button 
                        onClick={() => {
                          const updated = [...(newExam.questions || [])];
                          updated.splice(i, 1);
                          setNewExam(prev => ({ ...prev, questions: updated }));
                        }}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</label>
                          <select 
                            value={q.section}
                            onChange={(e) => {
                              const section = e.target.value as SectionType;
                              let type: QuestionType = 'MCQ';
                              if (section === 'Listening') type = 'Listening';
                              if (section === 'Writing') type = 'Writing';
                              
                              const updated = [...(newExam.questions || [])];
                              updated[i].section = section;
                              updated[i].type = type;
                              
                              // Reset partType if switching away from Reading
                              if (section !== 'Reading') {
                                delete updated[i].partType;
                                delete updated[i].passageId;
                                delete updated[i].blanks;
                                delete updated[i].errorSentence;
                                delete updated[i].optionPool;
                                delete updated[i].blankMapping;
                              }
                              setNewExam(prev => ({ ...prev, questions: updated }));
                            }}
                            className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                          >
                            <option value="Listening">Listening</option>
                            <option value="Reading">Reading</option>
                            {newExam.level && newExam.level >= 3 && <option value="Writing">Writing</option>}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                          <select 
                            value={q.type}
                            onChange={(e) => {
                              const type = e.target.value as QuestionType;
                              const updated = [...(newExam.questions || [])];
                              updated[i].type = type;
                              if (type === 'True/False') {
                                updated[i].options = ['True', 'False'];
                                updated[i].correctAnswer = 'A';
                              }
                              setNewExam(prev => ({ ...prev, questions: updated }));
                            }}
                            className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                          >
                            {newExam.level && newExam.level <= 2 ? (
                              <>
                                <option value="MCQ">Multiple Choice</option>
                                <option value="True/False">True/False</option>
                                <option value="Listening">Listening (Audio)</option>
                              </>
                            ) : (
                              <>
                                <option value="MCQ">Multiple Choice</option>
                                <option value="Listening">Listening (Audio)</option>
                                <option value="Writing">Writing (Text Input)</option>
                              </>
                            )}
                          </select>
                        </div>

                        {q.section === 'Reading' && newExam.level && newExam.level >= 3 && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Part Type</label>
                            <select
                              value={q.partType || ''}
                              onChange={(e) => {
                                const partType = e.target.value;
                                const updated = [...(newExam.questions || [])];
                                updated[i].partType = partType;
                                
                                // Initialize specific fields based on partType
                                if (newExam.level === 3) {
                                  if (partType === 'Part I') {
                                    updated[i].optionImages = ['', '', '', ''];
                                    updated[i].options = ['A', 'B', 'C', 'D'];
                                  } else if (partType === 'Part II') {
                                    updated[i].options = ['', '', ''];
                                  } else if (partType === 'Part III') {
                                    updated[i].blanks = [{ question: '', options: ['', '', ''], correctAnswer: 'A' }];
                                  }
                                } else if (newExam.level === 4) {
                                  if (partType === 'Part I') {
                                    updated[i].options = ['', '', '', ''];
                                  } else if (partType === 'Part II') {
                                    updated[i].optionPool = ['', '', '', '', '', ''];
                                    updated[i].blankMapping = {};
                                  } else if (partType === 'Part III') {
                                    updated[i].blanks = [{ question: '', options: ['', '', '', ''], correctAnswer: 'A' }];
                                  }
                                } else if (newExam.level! >= 5) {
                                  if (partType.includes('Fill in Blanks') || (partType === 'Part II' && newExam.level === 6) || (partType === 'Part III' && newExam.level === 6)) {
                                    if (!updated[i].blanks) {
                                      updated[i].blanks = [{ options: ['', '', '', ''], correctAnswer: 'A' }];
                                    }
                                  }
                                  if (partType === 'Part I' && newExam.level === 6) {
                                    updated[i].options = ['', '', '', ''];
                                    updated[i].correctAnswer = 'A';
                                  }
                                }
                                setNewExam(prev => ({ ...prev, questions: updated }));
                              }}
                              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                            >
                              <option value="">Select Part</option>
                              {newExam.level === 3 && (
                                <>
                                  <option value="Part I">Part I (Match Picture)</option>
                                  <option value="Part II">Part II (Fill in Blank)</option>
                                  <option value="Part III">Part III (Short Passage)</option>
                                </>
                              )}
                              {newExam.level === 4 && (
                                <>
                                  <option value="Part I">Part I (Single Blank)</option>
                                  <option value="Part II">Part II (Multiple Blanks)</option>
                                  <option value="Part III">Part III (Longer Passage)</option>
                                </>
                              )}
                              {newExam.level === 5 && (
                                <>
                                  <option value="Part I">Part I (Fill in Blanks)</option>
                                  <option value="Part II">Part II (Short Passage)</option>
                                  <option value="Part III">Part III (Long Passage)</option>
                                </>
                              )}
                              {newExam.level === 6 && (
                                <>
                                  <option value="Part I">Part I (Error Detection)</option>
                                  <option value="Part II">Part II (Fill in Blanks)</option>
                                  <option value="Part III">Part III (Sentence Selection)</option>
                                  <option value="Part IV">Part IV (Long Passage)</option>
                                </>
                              )}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {q.partType?.includes('Passage') || q.partType?.includes('Blanks') ? 'Passage Text' : 'Question Text'}
                            </label>
                            <textarea 
                              value={q.text}
                              onChange={(e) => updateQuestion(i, { text: e.target.value })}
                              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-medium transition-all h-20 resize-none"
                              placeholder={q.partType === 'Part II' && newExam.level === 4 ? "Use (1), (2), etc. for blanks" : ""}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-all">
                              <Music className="w-3 h-3" />
                              {q.audioUrl ? 'Audio Added' : 'Add Audio'}
                              <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, i, 'audio')} className="hidden" />
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-all">
                              <ImageIcon className="w-3 h-3" />
                              {q.imageUrl ? 'Image Added' : 'Add Image'}
                              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, i, 'image')} className="hidden" />
                            </label>
                          </div>
                        </div>

                        {/* HSK 3 Part I: Match Picture */}
                        {q.partType === 'Part I' && newExam.level === 3 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['A', 'B', 'C', 'D'].map((opt, idx) => (
                              <div key={opt} className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Option {opt}</label>
                                <label className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">
                                  {q.optionImages?.[idx] ? (
                                    <img src={q.optionImages[idx]} alt={`Option ${opt}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <>
                                      <Plus className="w-6 h-6 text-gray-300" />
                                      <span className="text-[10px] font-bold text-gray-400">Upload Image</span>
                                    </>
                                  )}
                                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, i, 'optionImage', idx)} className="hidden" />
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* HSK 4 Part II: Multiple Blanks with Option Pool */}
                        {q.partType === 'Part II' && newExam.level === 4 && (
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Option Pool (A-F)</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {q.optionPool?.map((opt, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-blue-400">{String.fromCharCode(65 + idx)}</span>
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const pool = [...(q.optionPool || [])];
                                        pool[idx] = e.target.value;
                                        updateQuestion(i, { optionPool: pool });
                                      }}
                                      className="flex-1 px-3 py-1 bg-white border border-blue-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                      placeholder="Word/Phrase"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blank Mapping</label>
                                <p className="text-[10px] text-gray-400 italic">Map (1), (2), etc. to options A-F</p>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                {[1, 2, 3, 4, 5].map(num => (
                                  <div key={num} className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-600">({num})</span>
                                    <select
                                      value={q.blankMapping?.[num] || ''}
                                      onChange={(e) => {
                                        const mapping = { ...(q.blankMapping || {}) };
                                        mapping[num] = e.target.value;
                                        updateQuestion(i, { blankMapping: mapping });
                                      }}
                                      className="px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold"
                                    >
                                      <option value="">-</option>
                                      {['A', 'B', 'C', 'D', 'E', 'F'].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-questions for passages (HSK 3/4 Part III, HSK 5 Part I/III, HSK 6 Part II/IV) */}
                        {q.blanks && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {q.partType?.includes('Fill in Blanks') ? 'Blanks' : 'Sub-questions'}
                              </h4>
                              <button 
                                onClick={() => addBlank(i)}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                              >
                                + Add {q.partType?.includes('Fill in Blanks') ? 'Blank' : 'Question'}
                              </button>
                            </div>
                            <div className="space-y-3">
                              {q.blanks.map((blank, bIdx) => (
                                <div key={bIdx} className="p-4 bg-white border border-gray-100 rounded-xl space-y-3 relative">
                                  <button 
                                    onClick={() => removeBlank(i, bIdx)}
                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  {q.partType?.includes('Passage') && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {bIdx + 1}</label>
                                      <input 
                                        type="text"
                                        value={blank.question || ''}
                                        onChange={(e) => updateBlank(i, bIdx, 'question', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                        placeholder="Enter sub-question text"
                                      />
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {blank.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Option {String.fromCharCode(65 + optIdx)}</label>
                                        <input 
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const opts = [...blank.options];
                                            opts[optIdx] = e.target.value;
                                            updateBlank(i, bIdx, 'options', opts);
                                          }}
                                          className="w-full px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs"
                                        />
                                      </div>
                                    ))}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Correct</label>
                                      <select
                                        value={blank.correctAnswer}
                                        onChange={(e) => updateBlank(i, bIdx, 'correctAnswer', e.target.value)}
                                        className="w-full px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-600"
                                      >
                                        {blank.options.map((_, optIdx) => (
                                          <option key={optIdx} value={String.fromCharCode(65 + optIdx)}>{String.fromCharCode(65 + optIdx)}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Standard MCQ Options */}
                        {!q.blanks && q.type !== 'Writing' && q.partType !== 'Part II' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {q.options?.map((opt, optIdx) => (
                              <div key={optIdx} className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Option {String.fromCharCode(65 + optIdx)}</label>
                                <input 
                                  type="text" 
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...(q.options || [])];
                                    newOpts[optIdx] = e.target.value;
                                    updateQuestion(i, { options: newOpts });
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition-all"
                                />
                              </div>
                            ))}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Correct Answer</label>
                              <select 
                                value={q.correctAnswer}
                                onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                                className="w-full px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 text-sm font-bold text-blue-600 transition-all"
                              >
                                <option value="">Select</option>
                                {q.options?.map((opt, optIdx) => (
                                  <option key={optIdx} value={String.fromCharCode(65 + optIdx)}>{String.fromCharCode(65 + optIdx)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Writing Section */}
                        {q.type === 'Writing' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={q.aiEvaluated}
                                  onChange={(e) => updateQuestion(i, { aiEvaluated: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">AI Evaluated</span>
                              </label>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Answer (for AI evaluation)</label>
                              <textarea 
                                value={q.modelAnswer}
                                onChange={(e) => updateQuestion(i, { modelAnswer: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm font-medium transition-all h-24 resize-none"
                                placeholder="Enter the correct sentence or model essay..."
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks</label>
                            <input 
                              type="number"
                              value={q.maxMarks}
                              onChange={(e) => updateQuestion(i, { maxMarks: parseInt(e.target.value) })}
                              className="w-16 px-2 py-1 bg-white border border-gray-100 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Save Instant Exam
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="exam-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {exams.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Exam not Available now</h3>
                <p className="text-gray-400 font-medium mt-2">Check back later for new practice tests.</p>
              </div>
            ) : (
              exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <UserCheck className="w-3 h-3" /> Admin Created
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{exam.name}</h4>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                      <span className="text-sm font-bold text-gray-700">{exam.duration} Minutes</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Marks</span>
                      <span className="text-sm font-bold text-gray-700">{exam.totalMarks} Marks</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onStartExam(exam)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    Take Exam <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
