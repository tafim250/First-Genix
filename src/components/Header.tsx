import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';

interface HeaderProps {
  user: any;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-96">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search exams, results..."
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 font-medium">Student</p>
          </div>
          <div className="relative">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
              alt="Profile"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-blue-100 transition-all"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};
