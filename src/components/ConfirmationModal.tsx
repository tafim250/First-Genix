import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <button 
                  onClick={onCancel}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{message}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                    isDestructive 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
