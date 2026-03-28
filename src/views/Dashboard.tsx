import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Calendar, ArrowRight, Info } from 'lucide-react';
import { getUserResults, getInstantExams } from '../db';
import { ExamResult, Exam } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  user: any;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setActiveTab }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [instantExams, setInstantExams] = useState<Exam[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const res = await getUserResults(user.uid);
        setResults(res);
        const exams = await getInstantExams();
        setInstantExams(exams);
      }
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: 'Total Test', value: results.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Passed Exam', value: results.filter(r => r.passed).length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Fail Exam', value: results.filter(r => !r.passed).length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Scheduled Test', value: 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Welcome back, {user?.displayName || 'User'}! Track your HSK progress here.</p>
        </div>
        <button 
          onClick={() => setActiveTab('exams')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          Take a Test <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stats</span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stat.value.toString().padStart(2, '0')}</p>
            <p className="text-sm font-bold text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <p className="text-blue-900 font-bold text-lg">Today Task : {instantExams.length} Tests and 0 live Interview.</p>
            <p className="text-blue-700/70 text-sm font-medium">Complete your daily mock tests to stay on track.</p>
          </div>
        </div>
        <button className="text-blue-400 hover:text-blue-600 transition-colors p-2">
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Exams</h2>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-gray-50 border-gray-100 rounded-lg text-sm font-bold text-gray-600 px-4 py-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Select Category</option>
              <option>HSK Mock</option>
              <option>Instant Exam</option>
            </select>
            <select className="bg-gray-50 border-gray-100 rounded-lg text-sm font-bold text-gray-600 px-4 py-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs font-black uppercase tracking-widest">
                <th className="px-6 py-4">Test Name</th>
                <th className="px-6 py-4">Test Type</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No exams taken yet. Start your first test!
                  </td>
                </tr>
              ) : (
                results.slice(0, 5).map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{result.examName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">{result.level ? `HSK Level ${result.level}` : 'Instant Exam'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{result.score}/{result.totalMarks}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">{new Date(result.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 bg-gray-100 text-gray-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-400">Showing {Math.min(results.length, 5)} of {results.length} entries</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-white transition-colors">«</button>
            <button className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">1</button>
            <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-white transition-colors">2</button>
            <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-white transition-colors">»</button>
          </div>
        </div>
      </div>
    </div>
  );
};
