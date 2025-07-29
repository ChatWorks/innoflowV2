import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveTimer {
  id: string;
  taskId: string;
  taskTitle: string;
  deliverableId: string;
  deliverableTitle: string;
  projectId: string;
  projectName: string;
  startTime: Date;
  isPaused?: boolean;
}

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  isFloatingVisible: boolean;
  setFloatingVisible: (visible: boolean) => void;
  refreshTimeData: () => void;
  refreshTrigger: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isFloatingVisible, setFloatingVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshTimeData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        setActiveTimer,
        isFloatingVisible,
        setFloatingVisible,
        refreshTimeData,
        refreshTrigger,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};