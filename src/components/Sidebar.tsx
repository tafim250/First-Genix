import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, GraduationCap, Clock, User, LogOut, ShieldCheck, BarChart3 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: any;
  isAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user, isAdmin }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: GraduationCap },
    { id: 'instant-exam', label: 'Instant Exam', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
    menuItems.push({ id: 'analytics', label: 'Analytics', icon: BarChart3 });
  }

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-72 bg-[#0A192F] text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full -ml-32 -mt-32 blur-[80px]"></div>
      
      <div className="p-8 flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight leading-none">Fine Test</span>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">HSK Mastery</span>
        </div>
      </div>

      <nav className="flex-1 mt-8 px-6 space-y-2 relative z-10">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-4">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1.5 h-6 bg-white rounded-full -ml-1"
              />
            )}
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-300",
              activeTab === item.id ? "text-white scale-110" : "text-gray-500 group-hover:text-white group-hover:scale-110"
            )} />
            <span className="font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto relative z-10">
        <div className="bg-white/5 rounded-3xl p-5 mb-6 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-900/40 ring-2 ring-white/10">
              {getInitials(user?.name || 'User')}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-base font-black truncate leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] font-bold text-gray-500 truncate mt-0.5">{user?.email || 'user@example.com'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 text-white transition-all duration-300 text-xs font-black uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest">© 2026 Fine Test</p>
      </div>
    </div>
  );
};
