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
  success: 'bg-white border-l-4 border-green-500',
  error: 'bg-white border-l-4 border-red-500',
  info: 'bg-white border-l-4 border-blue-500'
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
      flex items-center gap-3 p-4 min-w-[300px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-black 
      animate-in slide-in-from-right duration-300
      ${bgColors[type]}
    `}>
      {icons[type]}
      <p className="flex-1 font-bold text-sm text-black">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="text-stone-400 hover:text-black transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
