import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, isAdmin, onLogout, activeTab, setActiveTab }) => {
  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden selection:bg-blue-500/10">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} user={user} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full -mr-64 -mt-64 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/5 rounded-full -ml-48 -mb-48 blur-[80px] pointer-events-none"></div>
        
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative z-10 will-change-scroll">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="will-change-transform"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
