import React from 'react';
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

  return (
    <div className="w-64 bg-[#0A192F] text-white flex flex-col h-full shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xl font-bold">F</span>
        </div>
        <span className="text-xl font-bold tracking-tight">FirstGenix</span>
      </div>
      <nav className="flex-1 mt-4 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
