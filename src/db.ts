import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Exam, ExamResult, UserProfile } from './types';

interface HSKDB extends DBSchema {
  profiles: {
    key: string;
    value: UserProfile;
  };
  results: {
    key: string;
    value: ExamResult;
    indexes: { 'by-user': string };
  };
  instant_exams: {
    key: string;
    value: Exam;
  };
  hsk_banks: {
    key: string;
    value: Exam;
  };
  users: {
    key: string;
    value: {
      uid: string;
      email: string;
      timestamp: number;
    };
  };
  analytics: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<HSKDB>>;

export const initDB = () => {
  dbPromise = openDB<HSKDB>('hsk-exam-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('profiles', { keyPath: 'uid' });
        const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
        resultsStore.createIndex('by-user', 'userId');
        db.createObjectStore('instant_exams', { keyPath: 'id' });
        db.createObjectStore('hsk_banks', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('users', { keyPath: 'uid' });
        db.createObjectStore('analytics');
      }
    },
  });
  return dbPromise;
};

export const getDB = () => {
  if (!dbPromise) return initDB();
  return dbPromise;
};

// Profile methods
export const saveProfile = async (profile: UserProfile) => {
  const db = await getDB();
  await db.put('profiles', profile);
};

export const getProfile = async (uid: string) => {
  const db = await getDB();
  return db.get('profiles', uid);
};

// Exam methods
export const saveInstantExam = async (exam: Exam) => {
  const db = await getDB();
  await db.put('instant_exams', exam);
};

export const getInstantExams = async () => {
  const db = await getDB();
  return db.getAll('instant_exams');
};

export const saveHSKBank = async (exam: Exam) => {
  const db = await getDB();
  await db.put('hsk_banks', exam);
};

export const getHSKExams = async (level: number) => {
  const db = await getDB();
  const all = await db.getAll('hsk_banks');
  return all.filter(e => e.level === level);
};

export const seedHSKExams = async (exams: Exam[]) => {
  const db = await getDB();
  const tx = db.transaction('hsk_banks', 'readwrite');
  const store = tx.objectStore('hsk_banks');
  
  const count = await store.count();
  if (count === 0) {
    for (const exam of exams) {
      await store.put(exam);
    }
  }
  await tx.done;
};

// Result methods
export const saveResult = async (result: ExamResult) => {
  const db = await getDB();
  await db.put('results', result);
};

export const getUserResults = async (userId: string) => {
  const db = await getDB();
  return db.getAllFromIndex('results', 'by-user', userId);
};

// Analytics & User Tracking methods
export const incrementVisitCount = async () => {
  const db = await getDB();
  const tx = db.transaction('analytics', 'readwrite');
  const store = tx.objectStore('analytics');
  const currentCount = (await store.get('visitCount')) || 0;
  await store.put(currentCount + 1, 'visitCount');
  await tx.done;
};

export const getVisitCount = async () => {
  const db = await getDB();
  return (await db.get('analytics', 'visitCount')) || 0;
};

export const trackUser = async (uid: string, email: string) => {
  const db = await getDB();
  const existing = await db.get('users', uid);
  if (!existing) {
    await db.put('users', { uid, email, timestamp: Date.now() });
  }
};

export const getTotalUsersCount = async () => {
  const db = await getDB();
  return db.count('users');
};

export const getTotalExamsCount = async () => {
  const db = await getDB();
  return db.count('results');
};
