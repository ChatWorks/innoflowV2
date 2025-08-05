// Notification permission utilities
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'innoflow-goal-reminder',
      ...options
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }
};

// Goal-specific notification helpers
export const sendGoalReminder = (goalTitle: string, message: string) => {
  showBrowserNotification(`🎯 Goal Reminder: ${goalTitle}`, {
    body: message,
    icon: '/favicon.ico',
    tag: 'goal-reminder'
  });
};

export const sendGoalDeadlineWarning = (goalTitle: string, daysLeft: number) => {
  showBrowserNotification(`⏰ Deadline Alert: ${goalTitle}`, {
    body: `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to complete this goal!`,
    icon: '/favicon.ico',
    tag: 'deadline-warning'
  });
};

export const sendGoalCompletionCelebration = (goalTitle: string) => {
  showBrowserNotification(`🎉 Goal Completed: ${goalTitle}`, {
    body: 'Congratulations! You have successfully completed your goal!',
    icon: '/favicon.ico',
    tag: 'goal-completed'
  });
};

// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};