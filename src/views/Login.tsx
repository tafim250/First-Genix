import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, ShieldCheck, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full -mr-[400px] -mt-[400px] blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full -ml-[300px] -mb-[300px] blur-[100px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1100px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <div className="w-full md:w-1/2 bg-[#0A192F] p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight">FirstGenix</span>
            </div>
            <h1 className="text-5xl font-black mb-6 leading-tight tracking-tighter">Master the HSK <br />with Confidence.</h1>
            <p className="text-blue-100/60 text-lg font-medium leading-relaxed">Join thousands of students worldwide practicing for the HSK exam with our AI-powered platform.</p>
          </div>
          <div className="relative z-10 mt-12 grid grid-cols-2 gap-8">
            <div>
              <p className="text-3xl font-black text-blue-500 mb-1">10k+</p>
              <p className="text-xs font-black text-blue-100/40 uppercase tracking-widest">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-500 mb-1">98%</p>
              <p className="text-xs font-black text-blue-100/40 uppercase tracking-widest">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-16 bg-white">
          <div className="max-w-md mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
              <p className="text-gray-400 font-medium">{isLogin ? 'Sign in to continue your HSK journey.' : 'Start your journey to HSK mastery today.'}</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-bold"
                >
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="my-10 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
              >
                <Chrome className="w-5 h-5 text-red-500" /> Google
              </button>
              <button className="flex items-center justify-center gap-3 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                <Github className="w-5 h-5 text-gray-900" /> GitHub
              </button>
            </div>

            <p className="mt-12 text-center text-gray-400 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-black uppercase tracking-widest text-xs hover:text-blue-700 transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
