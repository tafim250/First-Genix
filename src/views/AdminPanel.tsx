import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth } from '../firebase';
import { Exam, Question, HSKLevel, SectionType, QuestionType } from '../types';
import { Plus, Trash2, Upload, Music, Image as ImageIcon, Save, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  user: User;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'create' | 'settings'>('create');
  const [adminEmail, setAdminEmail] = useState('mdtafim77889@gmail.com');
  const [examName, setExamName] = useState('');

  React.useEffect(() => {
    const fetchAdminEmail = async () => {
      const path = 'settings/admin';
      try {
        const adminDoc = await getDocFromServer(doc(db, path));
        if (adminDoc.exists()) {
          setAdminEmail(adminDoc.data().email);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchAdminEmail();
  }, []);
  const [level, setLevel] = useState<HSKLevel>(1);
  const [duration, setDuration] = useState(40);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number, type: 'audio' | 'image' | 'optionImage', optionIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 500KB for Base64 storage in Firestore)
    if (file.size > 500 * 1024) {
      setStatus({ type: 'error', message: 'File size too large. Please keep it under 500KB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedQuestions = [...questions];
      
      if (type === 'audio') {
        updatedQuestions[questionIndex].audioUrl = base64String;
      } else if (type === 'image') {
        updatedQuestions[questionIndex].imageUrl = base64String;
      } else if (type === 'optionImage' && optionIndex !== undefined) {
        if (!updatedQuestions[questionIndex].optionImages) {
          updatedQuestions[questionIndex].optionImages = [];
        }
        updatedQuestions[questionIndex].optionImages![optionIndex] = base64String;
      }
      
      setQuestions(updatedQuestions);
    };
    reader.readAsDataURL(file);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `custom-${Date.now()}`,
      type: 'MCQ',
      section: 'Listening',
      level: level, // Set the current level
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 'A',
      maxMarks: 2,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    (updatedQuestions[index] as any)[field] = value;
    setQuestions(updatedQuestions);
  };

  const addBlank = (qIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[qIndex].blanks) updatedQuestions[qIndex].blanks = [];
    updatedQuestions[qIndex].blanks!.push({ options: ['', '', '', ''], correctAnswer: 'A' });
    setQuestions(updatedQuestions);
  };

  const removeBlank = (qIndex: number, bIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].blanks = updatedQuestions[qIndex].blanks!.filter((_, i) => i !== bIndex);
    setQuestions(updatedQuestions);
  };

  const updateBlank = (qIndex: number, bIndex: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[qIndex].blanks && updatedQuestions[qIndex].blanks![bIndex]) {
      (updatedQuestions[qIndex].blanks![bIndex] as any)[field] = value;
      setQuestions(updatedQuestions);
    }
  };

  const saveExam = async () => {
    if (!examName || questions.length === 0) {
      setStatus({ type: 'error', message: 'Please provide an exam name and at least one question.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const examData: Partial<Exam> = {
        name: examName,
        level,
        duration,
        sectionDurations: {
          Listening: level <= 2 ? Math.floor(duration * 0.5) : Math.floor(duration * 0.35),
          Reading: level <= 2 ? Math.floor(duration * 0.5) : Math.floor(duration * 0.35),
          Writing: level <= 2 ? 0 : Math.floor(duration * 0.3),
        },
        totalMarks: questions.reduce((acc, q) => acc + q.maxMarks, 0),
        questions,
        createdBy: user.uid,
      };

      await addDoc(collection(db, 'hsk_exams'), {
        ...examData,
        createdAt: serverTimestamp(),
      });

      setStatus({ type: 'success', message: 'Exam saved successfully!' });
      setExamName('');
      setQuestions([]);
    } catch (error) {
      console.error('Error saving exam:', error);
      setStatus({ type: 'error', message: 'Failed to save exam. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500">Create and manage HSK exam questions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setActiveAdminTab('create')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeAdminTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Create Exam
            </button>
            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeAdminTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
          {activeAdminTab === 'create' && (
            <button
              onClick={saveExam}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
            >
              {isSaving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Save className="w-5 h-5" />
                </motion.div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Exam
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeAdminTab === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Admin Settings</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Admin Email</label>
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await setDoc(doc(db, 'settings', 'admin'), { email: adminEmail });
                        setStatus({ type: 'success', message: 'Admin email updated successfully!' });
                      } catch (error) {
                        setStatus({ type: 'error', message: 'Failed to update admin email.' });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                  >
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-400 italic">Warning: Changing this email will change who can access this admin panel.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="font-medium">{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Exam Name</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g., HSK 1 Mock Test 2026"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">HSK Level</label>
                  <select
                    value={level}
                    onChange={(e) => {
                      const newLevel = parseInt(e.target.value) as HSKLevel;
                      setLevel(newLevel);
                      setQuestions(prev => prev.map(q => ({ ...q, level: newLevel })));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h2>
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 relative group"
                  >
                    <button
                      onClick={() => removeQuestion(index)}
                      className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Section</label>
                              <select
                                value={q.section}
                                onChange={(e) => {
                                  const section = e.target.value as SectionType;
                                  let type: QuestionType = 'MCQ';
                                  if (section === 'Listening') type = 'Listening';
                                  if (section === 'Writing') type = 'Writing';
                                  
                                  const updatedQuestions = [...questions];
                                  updatedQuestions[index].section = section;
                                  updatedQuestions[index].type = type;
                                  
                                  // Reset partType if switching away from Reading
                                  if (section !== 'Reading') {
                                    delete updatedQuestions[index].partType;
                                    delete updatedQuestions[index].passageId;
                                    delete updatedQuestions[index].blanks;
                                    delete updatedQuestions[index].errorSentence;
                                    delete updatedQuestions[index].optionPool;
                                    delete updatedQuestions[index].blankMapping;
                                  }
                                  
                                  setQuestions(updatedQuestions);
                                }}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                              >
                                <option value="Listening">Listening</option>
                                <option value="Reading">Reading</option>
                                {level >= 3 && <option value="Writing">Writing</option>}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Question Type</label>
                              <select
                                value={q.type}
                                onChange={(e) => {
                                  const type = e.target.value as QuestionType;
                                  const updatedQuestions = [...questions];
                                  updatedQuestions[index].type = type;
                                  if (type === 'True/False') {
                                    updatedQuestions[index].options = ['True', 'False'];
                                    updatedQuestions[index].correctAnswer = 'A'; // Default to True
                                  }
                                  setQuestions(updatedQuestions);
                                }}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                              >
                                {level <= 2 ? (
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
                          </div>
                          {(level >= 3 && q.section === 'Reading') && (
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Part Type</label>
                                <select
                                  value={q.partType || ''}
                                  onChange={(e) => {
                                    const partType = e.target.value;
                                    const updatedQuestions = [...questions];
                                    updatedQuestions[index].partType = partType;
                                    
                                    // Initialize specific fields based on partType
                                    if (level === 3) {
                                      if (partType === 'Part I') {
                                        updatedQuestions[index].optionImages = ['', '', '', ''];
                                        updatedQuestions[index].options = ['A', 'B', 'C', 'D'];
                                      } else if (partType === 'Part II') {
                                        updatedQuestions[index].options = ['', '', ''];
                                      } else if (partType === 'Part III') {
                                        updatedQuestions[index].blanks = [{ question: '', options: ['', '', ''], correctAnswer: 'A' }];
                                      }
                                    } else if (level === 4) {
                                      if (partType === 'Part I') {
                                        updatedQuestions[index].options = ['', '', '', ''];
                                      } else if (partType === 'Part II') {
                                        updatedQuestions[index].optionPool = ['', '', '', '', '', ''];
                                        updatedQuestions[index].blankMapping = {};
                                      } else if (partType === 'Part III') {
                                        updatedQuestions[index].blanks = [{ question: '', options: ['', '', '', ''], correctAnswer: 'A' }];
                                      }
                                    } else if (level >= 5) {
                                      if (partType.includes('Fill in Blanks') || partType === 'Part II' && level === 6 || partType === 'Part III' && level === 6) {
                                        if (!updatedQuestions[index].blanks) {
                                          updatedQuestions[index].blanks = [{ options: ['', '', '', ''], correctAnswer: 'A' }];
                                        }
                                      }
                                      if (partType === 'Part I' && level === 6) {
                                        updatedQuestions[index].options = ['', '', '', ''];
                                        updatedQuestions[index].correctAnswer = 'A';
                                      }
                                    }
                                    
                                    setQuestions(updatedQuestions);
                                  }}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                >
                                  <option value="">Select Part</option>
                                  {level === 3 && (
                                    <>
                                      <option value="Part I">Part I (Match Picture)</option>
                                      <option value="Part II">Part II (Fill in Blank)</option>
                                      <option value="Part III">Part III (Short Passage)</option>
                                    </>
                                  )}
                                  {level === 4 && (
                                    <>
                                      <option value="Part I">Part I (Single Blank)</option>
                                      <option value="Part II">Part II (Multiple Blanks)</option>
                                      <option value="Part III">Part III (Longer Passage)</option>
                                    </>
                                  )}
                                  {level === 5 && (
                                    <>
                                      <option value="Part I">Part I (Fill in Blanks)</option>
                                      <option value="Part II">Part II (Short Passage)</option>
                                      <option value="Part III">Part III (Long Passage)</option>
                                    </>
                                  )}
                                  {level === 6 && (
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
                            <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                              {q.partType?.includes('Passage') || q.partType?.includes('Blanks') || q.partType?.includes('Selection') ? 'Passage Text' : 'Question Text / Prompt'}
                            </label>
                            <textarea
                              value={q.text}
                              onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                              placeholder={q.partType?.includes('Passage') ? "Enter passage text..." : "Enter question text or writing prompt..."}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none h-24 resize-none"
                            />
                          </div>

                          {level === 3 && q.partType === 'Part I' && (
                            <div className="space-y-4">
                              <label className="text-xs font-bold text-gray-500 uppercase">Image Options (A-D)</label>
                              <div className="grid grid-cols-2 gap-4">
                                {['A', 'B', 'C', 'D'].map((label, i) => (
                                  <div key={label} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm">Option {label}</span>
                                      <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                                        <Upload className="w-4 h-4" />
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleFileUpload(e, index, 'optionImage', i)}
                                        />
                                      </label>
                                    </div>
                                    {q.optionImages?.[i] ? (
                                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                                        <img src={q.optionImages[i]} alt={`Option ${label}`} className="w-full h-full object-cover" />
                                        <button
                                          onClick={() => {
                                            const newImages = [...(q.optionImages || [])];
                                            newImages[i] = '';
                                            updateQuestion(index, 'optionImages', newImages);
                                          }}
                                          className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="aspect-video rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-8 h-8" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Correct Image</label>
                                <select
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                >
                                  {['A', 'B', 'C', 'D'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                            </div>
                          )}

                          {((level === 3 && q.partType === 'Part II') || (level === 4 && q.partType === 'Part I')) && (
                            <div className="space-y-4">
                              <label className="text-xs font-bold text-gray-500 uppercase">Options ({level === 3 ? 'A-C' : 'A-D'})</label>
                              <div className="grid grid-cols-2 gap-2">
                                {(level === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']).map((label, i) => (
                                  <div key={label} className="flex gap-2">
                                    <span className="font-bold py-2 w-6">{label}</span>
                                    <input
                                      type="text"
                                      value={q.options?.[i] || ''}
                                      onChange={(e) => {
                                        const newOpts = [...(q.options || [])];
                                        newOpts[i] = e.target.value;
                                        updateQuestion(index, 'options', newOpts);
                                      }}
                                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                      placeholder={`Option ${label}...`}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Correct Option</label>
                                <select
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                >
                                  {(level === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                            </div>
                          )}

                          {level === 4 && q.partType === 'Part II' && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs text-blue-700 font-medium">
                                  <strong>Tip:</strong> Use markers like <strong>(1)</strong>, <strong>(2)</strong>, etc. in the Passage Text above to indicate where the blanks should appear.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Option Pool (Words/Phrases)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {q.optionPool?.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                      <span className="font-bold py-2 w-6">{String.fromCharCode(65 + i)}</span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const newPool = [...(q.optionPool || [])];
                                          newPool[i] = e.target.value;
                                          updateQuestion(index, 'optionPool', newPool);
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                        placeholder={`Option ${String.fromCharCode(65 + i)}...`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Blank Mapping</label>
                                  <button
                                    onClick={() => {
                                      const newMapping = { ...(q.blankMapping || {}) };
                                      const nextNum = Object.keys(newMapping).length + 1;
                                      newMapping[nextNum] = 'A';
                                      updateQuestion(index, 'blankMapping', newMapping);
                                    }}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                  >
                                    + Add Mapping
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(q.blankMapping || {}).map(([blankNum, choiceId]) => (
                                    <div key={blankNum} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                      <span className="text-xs font-bold">Blank {blankNum}:</span>
                                      <select
                                        value={choiceId}
                                        onChange={(e) => {
                                          const newMapping = { ...(q.blankMapping || {}) };
                                          newMapping[parseInt(blankNum)] = e.target.value;
                                          updateQuestion(index, 'blankMapping', newMapping);
                                        }}
                                        className="px-2 py-1 rounded border border-gray-200 text-xs outline-none"
                                      >
                                        {q.optionPool?.map((_, i) => (
                                          <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          const newMapping = { ...(q.blankMapping || {}) };
                                          delete newMapping[parseInt(blankNum)];
                                          updateQuestion(index, 'blankMapping', newMapping);
                                        }}
                                        className="text-red-400 hover:text-red-600 ml-auto"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {((level === 3 || level === 4) && q.partType === 'Part III') && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs text-blue-700 font-medium">
                                  <strong>Tip:</strong> Enter the passage text in the "Passage Text" field above, then add individual questions below.
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Questions for Passage</label>
                                <button
                                  onClick={() => {
                                    const newBlanks = [...(q.blanks || [])];
                                    newBlanks.push({
                                      question: '',
                                      options: level === 3 ? ['', '', ''] : ['', '', '', ''],
                                      correctAnswer: 'A'
                                    });
                                    updateQuestion(index, 'blanks', newBlanks);
                                  }}
                                  className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                  + Add Question
                                </button>
                              </div>
                              <div className="space-y-4">
                                {q.blanks?.map((blank, bIdx) => (
                                  <div key={bIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-gray-400">Question {bIdx + 1}</span>
                                      <button onClick={() => removeBlank(index, bIdx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={blank.question || ''}
                                      onChange={(e) => updateBlank(index, bIdx, 'question', e.target.value)}
                                      placeholder="Enter question..."
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      {(level === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']).map((opt, optIdx) => (
                                        <input
                                          key={opt}
                                          type="text"
                                          value={blank.options[optIdx]}
                                          onChange={(e) => {
                                            const newOpts = [...blank.options];
                                            newOpts[optIdx] = e.target.value;
                                            updateBlank(index, bIdx, 'options', newOpts);
                                          }}
                                          placeholder={`Option ${opt}`}
                                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none"
                                        />
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs font-bold text-gray-500">Correct:</label>
                                      <select
                                        value={blank.correctAnswer}
                                        onChange={(e) => updateBlank(index, bIdx, 'correctAnswer', e.target.value)}
                                        className="px-2 py-1 rounded border border-gray-200 text-xs outline-none"
                                      >
                                        {(level === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']).map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2">
                                <p className="text-[10px] text-gray-400 italic">
                                  Total marks for this question block will be divided equally among sub-questions.
                                </p>
                              </div>
                            </div>
                          )}

                          {level === 6 && q.partType === 'Part I' && (
                            <div className="space-y-4">
                              <label className="text-xs font-bold text-gray-500 uppercase">Sentences (One has an error)</label>
                              <div className="space-y-2">
                                {['A', 'B', 'C', 'D'].map((label, sIdx) => (
                                  <div key={label} className="flex gap-2">
                                    <span className="font-bold py-2 w-6">{label}</span>
                                    <input
                                      type="text"
                                      value={q.options?.[sIdx] || ''}
                                      onChange={(e) => {
                                        const newOpts = [...(q.options || ['', '', '', ''])];
                                        newOpts[sIdx] = e.target.value;
                                        updateQuestion(index, 'options', newOpts);
                                      }}
                                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                      placeholder={`Sentence ${label}...`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(q.partType === 'Part I' && level === 5 || q.partType === 'Part II' && level === 6) && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Blanks & Options</label>
                                <button
                                  onClick={() => addBlank(index)}
                                  className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                  + Add Blank
                                </button>
                              </div>
                              <div className="space-y-4">
                                {q.blanks?.map((blank, bIdx) => (
                                  <div key={bIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-gray-400">Blank {bIdx + 1}</span>
                                      <button onClick={() => removeBlank(index, bIdx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                                        <input
                                          key={opt}
                                          type="text"
                                          value={blank.options[optIdx]}
                                          onChange={(e) => {
                                            const newOpts = [...blank.options];
                                            newOpts[optIdx] = e.target.value;
                                            updateBlank(index, bIdx, 'options', newOpts);
                                          }}
                                          placeholder={`Option ${opt}`}
                                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none"
                                        />
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs font-bold text-gray-500">Correct:</label>
                                      <select
                                        value={blank.correctAnswer}
                                        onChange={(e) => updateBlank(index, bIdx, 'correctAnswer', e.target.value)}
                                        className="px-2 py-1 rounded border border-gray-200 text-xs outline-none"
                                      >
                                        {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {level === 6 && q.partType === 'Part III' && (
                            <div className="space-y-4">
                              <label className="text-xs font-bold text-gray-500 uppercase">Sentence Options (A-E)</label>
                              <div className="space-y-2">
                                {['A', 'B', 'C', 'D', 'E'].map((label, sIdx) => (
                                  <div key={label} className="flex gap-2">
                                    <span className="font-bold py-2 w-6">{label}</span>
                                    <input
                                      type="text"
                                      value={q.options?.[sIdx] || ''}
                                      onChange={(e) => {
                                        const newOpts = [...(q.options || ['', '', '', '', ''])];
                                        newOpts[sIdx] = e.target.value;
                                        updateQuestion(index, 'options', newOpts);
                                      }}
                                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 outline-none"
                                      placeholder={`Sentence ${label}...`}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Correct Answers for Blanks (1-5)</label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map((bNum, bIdx) => (
                                    <div key={bNum} className="space-y-1">
                                      <span className="text-[10px] font-bold text-gray-400 block text-center">#{bNum}</span>
                                      <select
                                        value={q.blanks?.[bIdx]?.correctAnswer || 'A'}
                                        onChange={(e) => {
                                          const newBlanks = [...(q.blanks || Array.from({ length: 5 }, () => ({ correctAnswer: 'A', options: [] })))];
                                          newBlanks[bIdx] = { ...newBlanks[bIdx], correctAnswer: e.target.value };
                                          updateQuestion(index, 'blanks', newBlanks);
                                        }}
                                        className="w-full px-2 py-1 rounded border border-gray-200 text-xs outline-none"
                                      >
                                        {['A', 'B', 'C', 'D', 'E'].map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {(q.partType === 'Part III' && level === 5 || q.partType === 'Part IV' && level === 6) && (
                            <div className="space-y-2 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                              <label className="text-xs font-bold text-orange-700 uppercase">Passage ID (for grouping)</label>
                              <input
                                type="text"
                                value={q.passageId || ''}
                                onChange={(e) => updateQuestion(index, 'passageId', e.target.value)}
                                placeholder="e.g., passage-1"
                                className="w-full px-4 py-2 rounded-lg border border-orange-200 bg-white outline-none"
                              />
                              <p className="text-[10px] text-orange-600 italic">Questions with the same ID will share the same passage text.</p>
                            </div>
                          )}
                          
                          {q.section === 'Writing' && level >= 4 && (
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <input
                                type="checkbox"
                                id={`ai-eval-${index}`}
                                checked={q.aiEvaluated || false}
                                onChange={(e) => updateQuestion(index, 'aiEvaluated', e.target.checked)}
                                className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={`ai-eval-${index}`} className="text-sm font-bold text-blue-700">
                                Mark as AI Evaluated (Last 5 questions)
                              </label>
                            </div>
                          )}

                          {(q.type === 'Writing' || q.aiEvaluated) && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase text-blue-600">
                                {q.aiEvaluated ? 'Model Answer (for AI Evaluation)' : 'Correct Answer / Keywords'}
                              </label>
                              <textarea
                                value={q.modelAnswer || ''}
                                onChange={(e) => updateQuestion(index, 'modelAnswer', e.target.value)}
                                placeholder={q.aiEvaluated ? "Enter the ideal answer for AI to compare against..." : "Enter keywords or correct sentence..."}
                                className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 outline-none h-24 resize-none"
                              />
                            </div>
                          )}
                        </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Audio (MP3)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload(e, index, 'audio')}
                                className="hidden"
                                id={`audio-${index}`}
                              />
                              <label
                                htmlFor={`audio-${index}`}
                                className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                                  q.audioUrl ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 hover:border-blue-500 text-gray-500'
                                }`}
                              >
                                <Music className="w-4 h-4" />
                                {q.audioUrl ? 'Audio Added' : 'Upload Audio'}
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Main Image</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, index, 'image')}
                                className="hidden"
                                id={`image-${index}`}
                              />
                              <label
                                htmlFor={`image-${index}`}
                                className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                                  q.imageUrl ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 hover:border-blue-500 text-gray-500'
                                }`}
                              >
                                <ImageIcon className="w-4 h-4" />
                                {q.imageUrl ? 'Image Added' : 'Upload Image'}
                              </label>
                            </div>
                          </div>
                        </div>

                        {!(q.section === 'Writing' || (q.section === 'Reading' && (((level === 3 || level === 4) && q.partType) || (level === 5 && q.partType === 'Part I') || (level === 6 && ['Part I', 'Part II', 'Part III'].includes(q.partType || ''))))) && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Options (MCQ / True/False)</label>
                            <div className="grid grid-cols-2 gap-4">
                              {(q.type === 'True/False' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((opt, optIdx) => (
                                <div key={opt} className="space-y-2">
                                  <input
                                    type="text"
                                    value={q.options?.[optIdx] || ''}
                                    readOnly={q.type === 'True/False'}
                                    onChange={(e) => {
                                      const newOpts = [...(q.options || ['', '', '', ''])];
                                      newOpts[optIdx] = e.target.value;
                                      updateQuestion(index, 'options', newOpts);
                                    }}
                                    placeholder={q.type === 'True/False' ? (opt === 'A' ? 'True' : 'False') : `Option ${opt} Text`}
                                    className={`w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none ${q.type === 'True/False' ? 'bg-gray-50' : ''}`}
                                  />
                                  {q.type !== 'True/False' && (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, index, 'optionImage', optIdx)}
                                        className="hidden"
                                        id={`opt-img-${index}-${optIdx}`}
                                      />
                                      <label
                                        htmlFor={`opt-img-${index}-${optIdx}`}
                                        className={`flex items-center justify-center gap-1 w-full px-2 py-1 rounded-lg border border-dashed cursor-pointer text-[10px] transition-all ${
                                          q.optionImages?.[optIdx] ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 hover:border-blue-500 text-gray-400'
                                        }`}
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        {q.optionImages?.[optIdx] ? 'Image' : 'Add Image'}
                                      </label>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {!(q.section === 'Writing' || (q.section === 'Reading' && (((level === 3 || level === 4) && q.partType) || (level === 5 && q.partType === 'Part I') || (level === 6 && ['Part II', 'Part III'].includes(q.partType || ''))))) && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Correct Answer</label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                              >
                                {(q.type === 'True/False' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(opt => (
                                  <option key={opt} value={opt}>{q.type === 'True/False' ? (opt === 'A' ? 'True' : 'False') : opt}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Marks</label>
                            <input
                              type="number"
                              value={q.maxMarks}
                              onChange={(e) => updateQuestion(index, 'maxMarks', parseInt(e.target.value))}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {questions.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No questions added yet. Click "Add Question" to start.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
