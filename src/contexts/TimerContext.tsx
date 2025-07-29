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
  refreshTimeData: (projectId?: string) => void;
  refreshTimeEntry: (projectId: string, taskId?: string) => void;
  refreshTrigger: number;
  lastRefreshProjectId: string | null;
  lastRefreshTaskId: string | null;
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
  const [lastRefreshProjectId, setLastRefreshProjectId] = useState<string | null>(null);
  const [lastRefreshTaskId, setLastRefreshTaskId] = useState<string | null>(null);

  const refreshTimeData = (projectId?: string) => {
    setRefreshTrigger(prev => prev + 1);
    setLastRefreshProjectId(projectId || null);
    setLastRefreshTaskId(null);
  };

  const refreshTimeEntry = (projectId: string, taskId?: string) => {
    setRefreshTrigger(prev => prev + 1);
    setLastRefreshProjectId(projectId);
    setLastRefreshTaskId(taskId || null);
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        setActiveTimer,
        isFloatingVisible,
        setFloatingVisible,
        refreshTimeData,
        refreshTimeEntry,
        refreshTrigger,
        lastRefreshProjectId,
        lastRefreshTaskId,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};