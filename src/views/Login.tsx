import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUserProfile, getUserProfile } from '../db';
import { motion, AnimatePresence } from 'motion/react';
import { LocalUser } from '../types';

import { ADMIN_EMAILS } from '../constants';

interface LoginProps {
  onSuccess: (user: any) => void;
  initialIsLogin?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, initialIsLogin = true }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(userCredential.user.uid);
        if (profile) {
          // Update isAdmin if needed based on email
          if (ADMIN_EMAILS.includes(profile.email) && !profile.isAdmin) {
            profile.isAdmin = true;
            await saveUserProfile(profile);
          }
          onSuccess(profile);
        } else {
          // Fallback if profile missing
          const fallbackProfile: LocalUser = {
            userId: userCredential.user.uid,
            email: userCredential.user.email || '',
            name: userCredential.user.displayName || '',
            isAdmin: ADMIN_EMAILS.includes(userCredential.user.email || ''),
            createdAt: Date.now(),
            passwordHash: '' // Not used in Firebase
          };
          await saveUserProfile(fallbackProfile);
          onSuccess(fallbackProfile);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const isAdmin = ADMIN_EMAILS.includes(email);
        const newUser: LocalUser = {
          userId: userCredential.user.uid,
          email: email,
          name: name,
          isAdmin: isAdmin,
          createdAt: Date.now(),
          passwordHash: '' // Not used in Firebase
        };
        await saveUserProfile(newUser);
        onSuccess(newUser);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
        setIsLogin(true); // Automatically switch to login
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const profile = await getUserProfile(userCredential.user.uid);
      
      if (profile) {
        // Update isAdmin if needed
        if (ADMIN_EMAILS.includes(profile.email) && !profile.isAdmin) {
          profile.isAdmin = true;
          await saveUserProfile(profile);
        }
        onSuccess(profile);
      } else {
        const newUser: LocalUser = {
          userId: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || '',
          isAdmin: ADMIN_EMAILS.includes(userCredential.user.email || ''),
          createdAt: Date.now(),
          passwordHash: ''
        };
        await saveUserProfile(newUser);
        onSuccess(newUser);
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full -mr-[400px] -mt-[400px] blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full -ml-[300px] -mb-[300px] blur-[100px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden relative z-10 p-10 md:p-12"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20 mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-gray-400 font-medium text-sm">
            {isLogin ? 'Sign in to continue your HSK journey' : 'Join Fine Test and master HSK today'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-6 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-6 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-6 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className="bg-white px-4 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-6 py-3.5 border border-gray-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-gray-400 font-medium text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-black uppercase tracking-widest text-[11px] hover:text-blue-700 transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
