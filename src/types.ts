export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type QuestionType = 'MCQ' | 'Writing' | 'Listening' | 'True/False';

export type SectionType = 'Listening' | 'Reading' | 'Writing';

export interface Question {
  id: string;
  type: QuestionType;
  section: SectionType;
  level?: HSKLevel; // The HSK level this question belongs to
  text: string;
  imageUrl?: string; // For questions with an image
  options?: string[];
  optionImages?: string[]; // For questions where options are images
  audioUrl?: string; // For real audio files
  correctAnswer?: string;
  modelAnswer?: string; // For writing evaluation
  aiEvaluated?: boolean; // Flag for AI scoring
  audioScript?: string; // For TTS listening
  maxMarks: number;
  partType?: string; // e.g., "Part I", "Part II", etc.
  passageId?: string; // for grouping questions that belong to the same long passage
  blanks?: { question?: string; options: string[]; correctAnswer: string }[]; // array for fill-in-the-blank or sub-questions
  errorSentence?: string; // for Part I of HSK 6, store which sentence is incorrect (A, B, C, or D)
  optionPool?: string[]; // array of choices for multiple-blank passages (HSK 4 Part II)
  blankMapping?: Record<number, string>; // mapping from blank number to correct choice ID
}

export interface Exam {
  id: string;
  name: string;
  level?: HSKLevel;
  duration: number; // total duration in minutes
  sectionDurations: Record<SectionType, number>; // duration per section
  totalMarks: number;
  questions: Question[];
  isInstant?: boolean;
  createdBy?: string; // Admin UID
}

export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  level?: HSKLevel;
  score: number;
  sectionScores: Record<SectionType, number>;
  totalMarks: number;
  passed: boolean;
  date: number;
  answers: Record<string, any>;
  feedback: Record<string, { score: number; comment: string }>;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isAdmin: boolean;
}
