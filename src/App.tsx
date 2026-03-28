import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { initDB, incrementVisitCount, trackUser } from './db';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Exams } from './views/Exams';
import { ExamInterface } from './views/ExamInterface';
import { InstantExam } from './views/InstantExam';
import { Profile } from './views/Profile';
import { AdminPanel } from './views/AdminPanel';
import { Analytics } from './views/Analytics';
import { Login } from './views/Login';
import { db } from './firebase';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { Exam } from './types';
import { motion, AnimatePresence } from 'motion/react';

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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [adminEmail, setAdminEmail] = useState('mdtafim77889@gmail.com');

  const isAdmin = user?.email === adminEmail;

  useEffect(() => {
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'analytics')) {
      setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const fetchAdminSettings = async () => {
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
    if (user) fetchAdminSettings();
  }, [user]);

  useEffect(() => {
    const setup = async () => {
      await initDB();
      
      // Visit tracking
      if (!sessionStorage.getItem('visitCounted')) {
        await incrementVisitCount();
        sessionStorage.setItem('visitCounted', 'true');
      }

      onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          await trackUser(user.uid, user.email || '');
        }
        setLoading(false);
      });
    };
    setup();
  }, []);

  // Copy/Download protection for non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 's' || e.key === 'p' || e.key === 'u')) {
          e.preventDefault();
        }
      };
      const handleSelectStart = (e: Event) => e.preventDefault();

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('selectstart', handleSelectStart);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('selectstart', handleSelectStart);
      };
    }
  }, [user, isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full shadow-xl shadow-blue-900/20"
        />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (activeExam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <ExamInterface 
          exam={activeExam} 
          user={user} 
          onClose={() => setActiveExam(null)} 
        />
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      isAdmin={isAdmin}
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <Dashboard user={user} setActiveTab={setActiveTab} />}
          {activeTab === 'exams' && <Exams user={user} onStartExam={setActiveExam} />}
          {activeTab === 'instant-exam' && <InstantExam user={user} onStartExam={setActiveExam} />}
          {activeTab === 'profile' && <Profile user={user} onLogout={handleLogout} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel user={user} />}
          {activeTab === 'analytics' && isAdmin && <Analytics />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
