import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />
};

const bgColors = {
  success: 'border-l-4 border-green-500',
  error: 'border-l-4 border-red-500',
  info: 'border-l-4 border-blue-500'
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={`
      flex items-center gap-3 p-4 min-w-[300px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-black bg-white
      animate-in slide-in-from-right duration-300 dark:bg-stone-900 dark:border-stone-700 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
      ${bgColors[type]}
    `}>
      {icons[type]}
      <p className="flex-1 font-bold text-sm text-black dark:text-white">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="text-stone-400 hover:text-black transition-colors dark:text-stone-500 dark:hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
