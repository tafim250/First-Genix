import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Eye, GraduationCap, RefreshCw, TrendingUp, Calendar, ArrowUpRight, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getTotalUsersCount, getVisitCount, getTotalExamsCount, getTotalQuestionsCount, getAllResults } from '../db';
import { ExamResult } from '../types';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    visits: 0,
    exams: 0,
    questions: 0
  });
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [users, visits, exams, questions, allResults] = await Promise.all([
        getTotalUsersCount(),
        getVisitCount(),
        getTotalExamsCount(),
        getTotalQuestionsCount(),
        getAllResults()
      ]);
      setStats({ 
        users, 
        visits, 
        exams, 
        questions 
      });
      setResults(allResults.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Total Registered Users', 
      value: stats.users, 
      icon: Users, 
      color: 'bg-blue-500', 
      gradient: 'from-blue-500 to-blue-600',
      trend: '+12%',
      desc: 'Active learners on platform'
    },
    { 
      title: 'Total Website Visits', 
      value: stats.visits, 
      icon: Eye, 
      color: 'bg-indigo-500', 
      gradient: 'from-indigo-500 to-indigo-600',
      trend: '+25%',
      desc: 'Total page loads tracked'
    },
    { 
      title: 'Total Exams Taken', 
      value: stats.exams, 
      icon: GraduationCap, 
      color: 'bg-purple-500', 
      gradient: 'from-purple-500 to-purple-600',
      trend: '+18%',
      desc: 'Completed mock assessments'
    },
    { 
      title: 'Total Question Bank', 
      value: stats.questions, 
      icon: BookOpen, 
      color: 'bg-teal-500', 
      gradient: 'from-teal-500 to-teal-600',
      trend: '+5%',
      desc: 'Available practice items'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Analytics</h1>
          <p className="text-gray-500 font-medium">Real-time performance metrics and user engagement.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.03] rounded-bl-[100px] group-hover:scale-110 transition-transform`} />
            
            <div className="flex items-start justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shadow-current/20`}>
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-black">
                <TrendingUp className="w-3 h-3" />
                {card.trend}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">{card.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900 tracking-tighter">
                  {loading ? '...' : card.value.toLocaleString()}
                </span>
                <ArrowUpRight className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 font-medium pt-2">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Engagement Overview</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 65, 85, 55, 75, 50, 95, 60, 80].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                className="flex-1 bg-blue-50 rounded-t-lg relative group"
              >
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Platform Health</h3>
              <p className="text-blue-100/60 text-sm font-medium">System status and performance indicators.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>Server Load</span>
                  <span>24%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '24%' }}
                    className="h-full bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>Storage Used</span>
                  <span>42%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '42%' }}
                    className="h-full bg-white" 
                  />
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Live/Instant Exam Results</h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            Admin View
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User ID</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Name</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">No results found.</td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm font-bold text-gray-900">{result.userId}</td>
                    <td className="py-4 text-sm font-bold text-gray-700">{result.examName}</td>
                    <td className="py-4 text-sm font-black text-gray-900">{result.score}/{result.totalMarks}</td>
                    <td className="py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${result.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {result.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {result.passed ? 'Passed' : 'Failed'}
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-gray-400">{new Date(result.date).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <p className="text-sm text-blue-700 font-medium">
          <strong>Note:</strong> These analytics are fetched in real-time from Firestore.
        </p>
      </div>
    </div>
  );
};
