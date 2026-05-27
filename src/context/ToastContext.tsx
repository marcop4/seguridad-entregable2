import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          let styleClass = '';
          let Icon = null;

          if (toast.type === 'success') {
            styleClass = 'bg-[#141414] border-green-500 text-green-400';
            Icon = CheckCircle;
          } else if (toast.type === 'error') {
            styleClass = 'bg-[#141414] border-red-500 text-red-400';
            Icon = AlertCircle;
          } else if (toast.type === 'warning') {
            styleClass = 'bg-[#141414] border-yellow-500 text-yellow-400';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-2 p-4 rounded-xl border border-l-4 shadow-xl font-bold animate-slide-up ${styleClass}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
