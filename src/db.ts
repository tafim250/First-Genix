import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  updateDoc,
  increment,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Exam, ExamResult, LocalUser, HSKLevel } from './types';

// ===============================================================
// Error Handling
// ===============================================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ===============================================================
// Database Operations
// ===============================================================

export const initDB = async () => {
  try {
    // Test connection
    await getDocFromServer(doc(db, 'settings', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};

// User Profile
export const saveUserProfile = async (user: LocalUser) => {
  const path = `users/${user.userId}`;
  try {
    await setDoc(doc(db, 'users', user.userId), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (userId: string): Promise<LocalUser | null> => {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? docSnap.data() as LocalUser : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

// Exams
export const saveHSKBank = async (exam: Exam) => {
  const path = `hsk_banks/${exam.id}`;
  try {
    await setDoc(doc(db, 'hsk_banks', exam.id), {
      ...exam,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getHSKBanks = async (): Promise<Exam[]> => {
  const path = 'hsk_banks';
  try {
    const querySnapshot = await getDocs(collection(db, 'hsk_banks'));
    return querySnapshot.docs.map(doc => doc.data() as Exam);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteHSKBank = async (examId: string) => {
  const path = `hsk_banks/${examId}`;
  try {
    await deleteDoc(doc(db, 'hsk_banks', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Results
export const saveResult = async (result: ExamResult) => {
  const path = `results/${result.id}`;
  try {
    await setDoc(doc(db, 'results', result.id), result);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserResults = async (userId: string): Promise<ExamResult[]> => {
  const path = 'results';
  try {
    const q = query(collection(db, 'results'), where('userId', '==', userId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ExamResult);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// Analytics
export const incrementVisitCount = async () => {
  const path = 'analytics/global';
  try {
    await setDoc(doc(db, 'analytics', 'global'), {
      visitCount: increment(1)
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getInstantExams = async (): Promise<Exam[]> => {
  const path = 'hsk_banks';
  try {
    const q = query(collection(db, 'hsk_banks'), where('isInstant', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Exam);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getVisitCount = async (): Promise<number> => {
  const path = 'analytics/global';
  try {
    const docSnap = await getDoc(doc(db, 'analytics', 'global'));
    return docSnap.exists() ? docSnap.data().visitCount || 0 : 0;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return 0;
  }
};

export const getTotalUsersCount = async (): Promise<number> => {
  const path = 'users';
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return 0;
  }
};

export const getTotalExamsCount = async (): Promise<number> => {
  const path = 'results';
  try {
    const querySnapshot = await getDocs(collection(db, 'results'));
    return querySnapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return 0;
  }
};

export const getTotalQuestionsCount = async (): Promise<number> => {
  const path = 'hsk_banks';
  try {
    const querySnapshot = await getDocs(collection(db, 'hsk_banks'));
    let total = 0;
    querySnapshot.docs.forEach(doc => {
      const exam = doc.data() as Exam;
      total += exam.questions.length;
    });
    return total;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return 0;
  }
};

export const getAllResults = async (): Promise<ExamResult[]> => {
  const path = 'results';
  try {
    const querySnapshot = await getDocs(collection(db, 'results'));
    return querySnapshot.docs.map(doc => doc.data() as ExamResult);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveInstantExam = async (exam: Exam) => {
  await saveHSKBank(exam);
};

// Auth Helpers (Legacy compatibility)
export const getCurrentUser = (): Promise<LocalUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        const profile = await getUserProfile(user.uid);
        resolve(profile);
      } else {
        resolve(null);
      }
    });
  });
};

export const logout = async () => {
  await signOut(auth);
};
