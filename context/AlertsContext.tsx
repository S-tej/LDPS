import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ref, onValue, push, remove, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from '../firebase/config';
import { AuthContext } from './AuthContext';

export type Alert = {
  id?: string;
  timestamp: number;
  type: 'critical' | 'warning' | 'info' | 'emergency';
  message: string;
  acknowledged: boolean;
  vitalSign?: string;
  value?: number | string;
};

type AlertsContextType = {
  alerts: Alert[];
  loading: boolean;
  triggerAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => Promise<void>;
  triggerEmergency: (message: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  clearAlert: (alertId: string) => Promise<void>;
};

export const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  loading: true,
  triggerAlert: async () => {},
  triggerEmergency: async () => {},
  acknowledgeAlert: async () => {},
  clearAlert: async () => {},
});

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAlerts = async (userId: string) => {
      try {
        // Use orderByChild to leverage the index we created
        const alertsRef = query(
          ref(database, `alerts/${userId}`),
          orderByChild('timestamp')
        );
        
        const snapshot = await get(alertsRef);
        if (snapshot.exists()) {
          const alertsData = snapshot.val();
          // Transform object to array and sort by timestamp (newest first)
          const alertsList = Object.entries(alertsData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }));
          alertsList.sort((a, b) => b.timestamp - a.timestamp);
          return alertsList;
        }
        return [];
      } catch (error) {
        console.error('Error loading alerts:', error);
        throw error;
      }
    };

    loadAlerts(user.uid).then((alertsList) => {
      setAlerts(alertsList);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load alerts:', error);
      setLoading(false);
    });

  }, [user]);

  const triggerAlert = async (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => {
    if (!user) return;
    
    const now = Date.now();
    const newAlert = {
      ...alert,
      timestamp: now,
      acknowledged: false
    };
    
    try {
      const alertsRef = ref(database, `alerts/${user.uid}`);
      await push(alertsRef, newAlert);

      // Send notification to caretakers
      await push(ref(database, `notifications/caretakers/${user.uid}`), {
        timestamp: now,
        patientId: user.uid,
        alertType: alert.type,
        message: alert.message,
        read: false
      });
    } catch (error) {
      console.error('Failed to trigger alert:', error);
      throw error;
    }
  };

  const triggerEmergency = async (message: string) => {
    await triggerAlert({
      type: 'emergency',
      message: message || 'Emergency assistance requested!'
    });
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;
    
    try {
      await push(ref(database, `alerts/${user.uid}/${alertId}/acknowledged`), true);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  };

  const clearAlert = async (alertId: string) => {
    if (!user) return;
    
    try {
      await remove(ref(database, `alerts/${user.uid}/${alertId}`));
    } catch (error) {
      console.error('Failed to clear alert:', error);
      throw error;
    }
  };

  return (
    <AlertsContext.Provider value={{
      alerts,
      loading,
      triggerAlert,
      triggerEmergency,
      acknowledgeAlert,
      clearAlert
    }}>
      {children}
    </AlertsContext.Provider>
  );
};
