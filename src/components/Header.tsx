import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';

interface HeaderProps {
  user: any;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-4 bg-gray-50/50 px-6 py-3 rounded-2xl border border-gray-100 w-[400px] group focus-within:bg-white focus-within:shadow-xl focus-within:shadow-blue-900/5 focus-within:border-blue-200 transition-all duration-300">
        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          placeholder="Search exams, results, or students..."
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400 font-medium"
        />
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <button className="relative p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 group">
            <Bell className="w-6 h-6" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
          </button>
        </div>

        <div className="h-10 w-px bg-gray-100"></div>

        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Student Account</p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-transparent group-hover:ring-blue-50 transition-all duration-300 shadow-lg shadow-gray-200">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-sm">
                  {getInitials(user?.name || 'User')}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-y-0.5 transition-transform" />
        </div>
      </div>
    </header>
  );
};
