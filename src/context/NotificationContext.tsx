import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  triggerRefresh: () => void;
  subscribeToRefresh: (callback: () => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listeners, setListeners] = useState<(() => void)[]>([]);

  const triggerRefresh = () => {
    listeners.forEach(callback => callback());
  };

  const subscribeToRefresh = (callback: () => void) => {
    setListeners(prev => [...prev, callback]);
    return () => {
      setListeners(prev => prev.filter(listener => listener !== callback));
    };
  };

  return (
    <NotificationContext.Provider value={{ triggerRefresh, subscribeToRefresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};