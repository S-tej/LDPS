import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../firebase/config';
import { AuthContext } from './AuthContext';

// Match the Firebase structure for vitals data
export type VitalSign = {
  timestamp: number;
  heartRate: number; 
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturation: number;
  temperature: number;
  ecgData: number[];
  ecgMetrics: {
    HRV_SDNN: number;
    HRV_RMSSD: number; 
    RR_interval: number;
    QRS_width: number;
    PR_interval: number;
    QT_interval: number; 
    ST_deviation: number;
    signal_quality: number;
  };
};

// Match the Firebase structure for thresholds
type AlertThresholds = {
  heartRateHigh: number;
  heartRateLow: number;
  bloodPressureHigh: {
    systolic: number;
    diastolic: number;
  };
  bloodPressureLow: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturationLow: number;
  temperatureHigh: number;
  temperatureLow: number;
};

type VitalsContextType = {
  currentVitals: VitalSign | null;
  historicalVitals: VitalSign[];
  lastUpdated: Date | null;
  loading: boolean;
  thresholds: AlertThresholds;
  updateThresholds: (newThresholds: Partial<AlertThresholds>) => Promise<void>;
  simulateReading: () => Promise<void>;
  checkAlertStatus: (vitals: VitalSign) => {[key: string]: boolean};
};

const defaultThresholds: AlertThresholds = {
  heartRateHigh: 100,
  heartRateLow: 60,
  bloodPressureHigh: {
    systolic: 140,
    diastolic: 90
  },
  bloodPressureLow: {
    systolic: 90,
    diastolic: 60
  },
  oxygenSaturationLow: 92,
  temperatureHigh: 37.8,
  temperatureLow: 35.5
};

export const VitalsContext = createContext<VitalsContextType>({
  currentVitals: null,
  historicalVitals: [],
  lastUpdated: null,
  loading: true,
  thresholds: defaultThresholds,
  updateThresholds: async () => {},
  simulateReading: async () => {},
  checkAlertStatus: () => ({}),
});

export const VitalsProvider = ({ children }: { children: ReactNode }) => {
  const [currentVitals, setCurrentVitals] = useState<VitalSign | null>(null);
  const [historicalVitals, setHistoricalVitals] = useState<VitalSign[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState<AlertThresholds>(defaultThresholds);
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen for real-time vitals updates - vitals/{userId}/current
    const vitalsRef = ref(database, `vitals/${user.uid}/current`);
    const unsubscribe = onValue(vitalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentVitals(data);
        setLastUpdated(new Date());
      }
      setLoading(false);
    });

    // Listen for threshold updates - vitals/{userId}/thresholds
    const thresholdsRef = ref(database, `vitals/${user.uid}/thresholds`);
    const thresholdsUnsubscribe = onValue(thresholdsRef, (snapshot) => {
      if (snapshot.exists()) {
        setThresholds(snapshot.val());
      } else {
        // If no thresholds set, initialize with defaults
        set(thresholdsRef, defaultThresholds);
      }
    });

    // Get historical data - vitals/{userId}/history
    const historyRef = ref(database, `vitals/${user.uid}/history`);
    const historyUnsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const vitalsArray = Object.values(data) as VitalSign[];
        // Sort by timestamp, newest first
        vitalsArray.sort((a, b) => b.timestamp - a.timestamp);
        setHistoricalVitals(vitalsArray.slice(0, 100)); // Keep last 100 readings
      }
    });

    return () => {
      unsubscribe();
      thresholdsUnsubscribe();
      historyUnsubscribe();
    };
  }, [user]);

  const updateThresholds = async (newThresholds: Partial<AlertThresholds>) => {
    if (!user) return;
    
    const updatedThresholds = { ...thresholds, ...newThresholds };
    setThresholds(updatedThresholds);
    
    try {
      // Update thresholds at vitals/{userId}/thresholds
      await set(ref(database, `vitals/${user.uid}/thresholds`), updatedThresholds);
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      throw error;
    }
  };

  // Function to generate simulated vital sign readings (for demo/testing)
  const simulateReading = async () => {
    if (!user) return;
    
    const now = Date.now();
    
    // Generate random ECG-like waveform data (simplified)
    const ecgPoints = [];
    for (let i = 0; i < 50; i++) {
      // Simplified ECG pattern generation
      const baseValue = 0.8;
      const peak = i % 10 === 5 ? 0.6 : 0;
      ecgPoints.push(baseValue + peak + (Math.random() * 0.1));
    }
    
    // Generate realistic ECG metrics
    const newVital: VitalSign = {
      timestamp: now,
      heartRate: Math.floor(Math.random() * (100 - 60) + 60),
      bloodPressure: {
        systolic: Math.floor(Math.random() * (140 - 110) + 110),
        diastolic: Math.floor(Math.random() * (90 - 70) + 70)
      },
      oxygenSaturation: Math.floor(Math.random() * (100 - 94) + 94),
      temperature: parseFloat((Math.random() * (37.2 - 36.5) + 36.5).toFixed(1)),
      ecgData: ecgPoints,
      ecgMetrics: {
        HRV_SDNN: Math.floor(Math.random() * (70 - 20) + 20), // 20-70ms range
        HRV_RMSSD: Math.floor(Math.random() * (50 - 15) + 15), // 15-50ms range
        RR_interval: Math.floor(Math.random() * (1100 - 750) + 750), // 750-1100ms range
        QRS_width: Math.floor(Math.random() * (120 - 70) + 70), // 70-120ms range
        PR_interval: Math.floor(Math.random() * (200 - 120) + 120), // 120-200ms range
        QT_interval: Math.floor(Math.random() * (450 - 350) + 350), // 350-450ms range
        ST_deviation: (Math.random() * 2 - 1) * 0.2, // -0.2 to 0.2mV range
        signal_quality: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) // 0.7-1.0 range
      }
    };

    try {
      // Update current reading at vitals/{userId}/current
      await set(ref(database, `vitals/${user.uid}/current`), newVital);
      
      // Add to history at vitals/{userId}/history/{timestamp}
      const historyRef = ref(database, `vitals/${user.uid}/history`);
      await push(historyRef, newVital);
      
      // Return nothing to match the expected type
      return;
    } catch (error) {
      console.error('Failed to simulate reading:', error);
      throw error;
    }
  };

  const checkAlertStatus = (vitals: VitalSign) => {
    if (!vitals) {
      return {
        heartRateHigh: false,
        heartRateLow: false,
        bloodPressureHigh: false,
        bloodPressureLow: false,
        oxygenSaturationLow: false,
        temperatureHigh: false,
        temperatureLow: false,
      };
    }

    return {
      heartRateHigh: vitals.heartRate > thresholds.heartRateHigh,
      heartRateLow: vitals.heartRate < thresholds.heartRateLow,
      bloodPressureHigh: 
        vitals.bloodPressure.systolic > thresholds.bloodPressureHigh.systolic || 
        vitals.bloodPressure.diastolic > thresholds.bloodPressureHigh.diastolic,
      bloodPressureLow:
        vitals.bloodPressure.systolic < thresholds.bloodPressureLow.systolic ||
        vitals.bloodPressure.diastolic < thresholds.bloodPressureLow.diastolic,
      oxygenSaturationLow: vitals.oxygenSaturation < thresholds.oxygenSaturationLow,
      temperatureHigh: vitals.temperature > thresholds.temperatureHigh,
      temperatureLow: vitals.temperature < thresholds.temperatureLow
    };
  };

  return (
    <VitalsContext.Provider value={{
      currentVitals,
      historicalVitals,
      lastUpdated,
      loading,
      thresholds,
      updateThresholds,
      simulateReading,
      checkAlertStatus
    }}>
      {children}
    </VitalsContext.Provider>
  );
};
