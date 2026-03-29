import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { incrementVisitCount, getUserProfile, logout } from './db';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Exams } from './views/Exams';
import { ExamInterface } from './views/ExamInterface';
import { InstantExam } from './views/InstantExam';
import { Profile } from './views/Profile';
import { AdminPanel } from './views/AdminPanel';
import { Analytics } from './views/Analytics';
import { Login } from './views/Login';
import { LandingPage } from './views/LandingPage';
import { Exam, LocalUser } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('landing');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<{ show: boolean; isLogin: boolean }>({ show: false, isLogin: true });
  const [pendingAction, setPendingAction] = useState<{ type: 'exam' | 'tab'; payload: any } | null>(null);

  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    if (user && activeTab === 'landing') {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'analytics')) {
      setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Visit tracking
    if (!sessionStorage.getItem('visitCounted')) {
      incrementVisitCount();
      sessionStorage.setItem('visitCounted', 'true');
    }

    return () => unsubscribe();
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

  const handleLogout = () => {
    logout();
    setUser(null);
    setActiveTab('landing');
  };

  const handleAuthSuccess = (user: LocalUser) => {
    setUser(user);
    setShowAuthModal({ show: false, isLogin: true });
    if (pendingAction) {
      if (pendingAction.type === 'exam') {
        setActiveTab('exams');
      } else if (pendingAction.type === 'tab') {
        setActiveTab(pendingAction.payload);
      }
      setPendingAction(null);
    }
  };

  const requireAuth = (action: () => void, type: 'exam' | 'tab', payload?: any) => {
    if (user) {
      action();
    } else {
      setPendingAction({ type, payload });
      setShowAuthModal({ show: true, isLogin: true });
    }
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
    <>
      {activeTab === 'landing' && !user ? (
        <LandingPage 
          onStartExam={(level) => requireAuth(() => setActiveTab('exams'), 'exam', level)}
          onLogin={() => setShowAuthModal({ show: true, isLogin: true })}
          onSignUp={() => setShowAuthModal({ show: true, isLogin: false })}
          onLiveExam={() => requireAuth(() => setActiveTab('instant-exam'), 'tab', 'instant-exam')}
        />
      ) : (
        <Layout 
          user={user} 
          isAdmin={isAdmin}
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            if (tab === 'exams' || tab === 'instant-exam' || tab === 'profile') {
              requireAuth(() => setActiveTab(tab), 'tab', tab);
            } else {
              setActiveTab(tab);
            }
          }}
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
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white"
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full h-full bg-white overflow-hidden"
            >
              <button 
                onClick={() => setShowAuthModal({ show: false, isLogin: true })}
                className="absolute top-8 right-8 z-[110] p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all duration-300"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="h-full overflow-y-auto custom-scrollbar">
                <Login 
                  onSuccess={handleAuthSuccess} 
                  initialIsLogin={showAuthModal.isLogin} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
