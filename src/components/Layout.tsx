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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} user={user} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
