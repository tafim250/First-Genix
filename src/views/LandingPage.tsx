import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, GraduationCap, Headphones, BookOpen, PenTool, Zap, ArrowRight, User, LogIn, Clock } from 'lucide-react';
import { HSKLevel, Exam } from '../types';
import { getInstantExams } from '../db';

interface LandingPageProps {
  onStartExam: (level: HSKLevel) => void;
  onLogin: () => void;
  onSignUp: () => void;
  onLiveExam: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartExam, onLogin, onSignUp, onLiveExam }) => {
  const [latestInstantExam, setLatestInstantExam] = useState<Exam | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      const exams = await getInstantExams();
      if (exams.length > 0) {
        // Find the most recent scheduled exam that hasn't started yet or is the latest one
        const scheduled = exams
          .filter(e => e.scheduledTime && e.scheduledTime > Date.now())
          .sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0))[0];
        
        setLatestInstantExam(scheduled || exams[exams.length - 1]);
      }
    };
    fetchExam();
  }, []);

  useEffect(() => {
    if (latestInstantExam?.scheduledTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        const diff = latestInstantExam.scheduledTime! - now;

        if (diff <= 0) {
          setTimeLeft(null);
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [latestInstantExam]);

  const levels: { level: HSKLevel; description: string; color: string }[] = [
    { level: 1, description: 'Basic vocabulary and simple sentences.', color: 'from-blue-400 to-blue-600' },
    { level: 2, description: 'Everyday topics and basic communication.', color: 'from-cyan-400 to-cyan-600' },
    { level: 3, description: 'Daily life, work, and social interactions.', color: 'from-teal-400 to-teal-600' },
    { level: 4, description: 'Fluency in a wide range of topics.', color: 'from-indigo-400 to-indigo-600' },
    { level: 5, description: 'Reading newspapers and watching movies.', color: 'from-purple-400 to-purple-600' },
    { level: 6, description: 'Expressing complex ideas with ease.', color: 'from-pink-400 to-pink-600' },
  ];

  const features = [
    { icon: Headphones, title: 'Listening', desc: 'Practice with high-quality audio recordings.' },
    { icon: BookOpen, title: 'Reading', desc: 'Improve comprehension with diverse texts.' },
    { icon: PenTool, title: 'Writing', desc: 'Master character strokes and sentence structure.' },
    { icon: Zap, title: 'AI Evaluation', desc: 'Get instant feedback on your writing skills.' },
  ];

  return (
    <div className="min-h-screen bg-[#0A192F] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0A192F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight">Fine Test</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-blue-100/60 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={onSignUp}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full -mr-[400px] -mt-[400px] blur-[120px]"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20">
              The Ultimate HSK Preparation Platform
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]">
              Master the HSK <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">with Confidence.</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/60 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Experience the most realistic HSK mock exams with AI-powered feedback, 
              comprehensive study materials, and real-time progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => onStartExam(1)}
                className="w-full sm:w-auto px-10 py-5 bg-white text-[#0A192F] rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                Start Free Mock Test
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={onLiveExam}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-600/20 transition-all flex items-center justify-center gap-3"
                >
                  Live Exam
                  <Zap className="w-5 h-5" />
                </button>
                {timeLeft && (
                  <div className="flex items-center gap-2 text-blue-400/60 font-black text-xs uppercase tracking-widest animate-pulse">
                    <Clock className="w-3 h-3" />
                    Starts in: {timeLeft}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HSK Levels Grid */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Choose Your Level</h2>
            <p className="text-blue-100/40 font-medium">Select an HSK level to view available mock tests.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {levels.map((l, idx) => (
              <motion.div
                key={l.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-[#0A192F] p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${l.color} flex flex-col items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 leading-none mb-1">HSK</span>
                  <span className="text-2xl font-black leading-none">{l.level}</span>
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">Level {l.level} Proficiency</h3>
                <p className="text-blue-100/60 mb-8 font-medium leading-relaxed">{l.description}</p>
                <button 
                  onClick={() => onStartExam(l.level)}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white hover:text-[#0A192F] transition-all flex items-center justify-center gap-2"
                >
                  View Mock Tests
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-[#0A192F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Everything you need to <span className="text-blue-500">ace the exam.</span>
            </h2>
            <p className="text-blue-100/40 font-medium max-w-2xl mx-auto">
              Our platform provides comprehensive tools designed to help you master every aspect of the HSK proficiency test.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <f.icon className="w-6 h-6 text-blue-500 group-hover:text-white" />
                </div>
                <h4 className="text-xl font-black tracking-tight mb-3">{f.title}</h4>
                <p className="text-blue-100/40 text-sm font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight">Fine Test</span>
          </div>
          <p className="text-blue-100/20 text-sm font-medium">© 2026 Fine Test HSK. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button className="text-sm font-black uppercase tracking-widest text-blue-100/20 hover:text-white transition-colors">Privacy</button>
            <button className="text-sm font-black uppercase tracking-widest text-blue-100/20 hover:text-white transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
