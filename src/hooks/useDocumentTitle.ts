import { useEffect, useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { formatTime } from '@/utils/timeUtils';

export const useDocumentTitle = () => {
  const { activeTimer } = useTimer();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (!activeTimer) {
      document.title = 'Innoflow';
      return;
    }

    if (activeTimer.isPaused) {
      setElapsedTime(pausedTime);
      document.title = `[⏸️ ${formatTime(pausedTime)}] Innoflow`;
      return;
    }

    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
      document.title = `[⏰ ${formatTime(elapsed)}] Innoflow`;
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, pausedTime]);

  // Update paused time when timer gets paused
  useEffect(() => {
    if (activeTimer?.isPaused) {
      setPausedTime(elapsedTime);
    }
  }, [activeTimer?.isPaused, elapsedTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.title = 'Innoflow';
    };
  }, []);
};