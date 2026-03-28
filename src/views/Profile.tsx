import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, History, ArrowRight, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { getUserResults } from '../db';
import { ExamResult } from '../types';
import { motion } from 'motion/react';

interface ProfileProps {
  user: any;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [results, setResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (user) {
        const res = await getUserResults(user.uid);
        setResults(res.sort((a, b) => b.date - a.date));
      }
    };
    fetchResults();
  }, [user]);

  const isAdmin = user.email === 'admin@example.com' || user.email === 'mdtafim77889@gmail.com';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-48 bg-[#0A192F] relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute -bottom-16 left-12 flex items-end gap-8">
            <div className="relative">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random&size=256`}
                alt="Profile"
                className="w-32 h-32 rounded-3xl object-cover ring-8 ring-white shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-black text-white tracking-tight">{user?.displayName || 'User'}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Student</span>
                {isAdmin && (
                  <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="pt-24 p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" /> Personal Information
            </h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-3 bg-white text-gray-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-gray-900">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-3 bg-white text-gray-400 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Status</p>
                  <p className="text-sm font-bold text-gray-900">Verified & Active</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout from Account
            </button>
          </div>

          <div className="space-y-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <History className="w-6 h-6 text-blue-600" /> Exam History
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {results.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No exam history found.</p>
                </div>
              ) : (
                results.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${result.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {result.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{result.examName}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(result.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-black text-gray-900">{result.score}/{result.totalMarks}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Math.round((result.score / result.totalMarks) * 100)}%</p>
                      </div>
                      <button className="p-2 bg-gray-50 text-gray-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
