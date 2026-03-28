import React, { useState, useEffect } from 'react';
import { Users, MousePointer2, FileText, RefreshCw } from 'lucide-react';
import { getTotalUsersCount, getVisitCount, getTotalExamsCount } from '../db';
import { motion } from 'motion/react';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVisits: 0,
    totalExams: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [users, visits, exams] = await Promise.all([
      getTotalUsersCount(),
      getVisitCount(),
      getTotalExamsCount(),
    ]);
    setStats({
      totalUsers: users,
      totalVisits: visits,
      totalExams: exams,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Registered Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Visits',
      value: stats.totalVisits,
      icon: MousePointer2,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Exams Taken',
      value: stats.totalExams,
      icon: FileText,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time platform usage statistics</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{card.value.toLocaleString()}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${card.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-8 h-8 ${card.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Data Collection Note</h4>
          <p className="text-sm text-blue-700 mt-1">
            Registered users are tracked when they log in for the first time after this feature was enabled. 
            Visits are counted once per session per page load.
          </p>
        </div>
      </div>
    </div>
  );
};
