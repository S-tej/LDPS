import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../firebase/config';
import { AuthContext } from './AuthContext';
import { useESP32Data, ESP32VitalData, validateESP32Data } from '../services/esp32Service';

export type VitalSign = {
  timestamp: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturation: number; // SpO2
  temperature: number;
  ecgData?: number[]; // ECG readings
  
  // New detailed cardiac metrics
  HRV_SDNN?: number;
  HRV_RMSSD?: number;
  RR_interval?: number;
  QRS_width?: number;
  PR_interval?: number;
  QT_interval?: number;
  ST_deviation?: number;
  signal_quality?: number;
};

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
  isLoading: boolean;
  lastUpdate: Date | null;
  signalQuality: number;
  refreshVitals: () => Promise<void>;
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
  isLoading: true,
  lastUpdate: null,
  signalQuality: 1,
  refreshVitals: async () => {},
});

export const VitalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [currentVitals, setCurrentVitals] = useState<VitalSign | null>(null);
  const [historicalVitals, setHistoricalVitals] = useState<VitalSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [signalQuality, setSignalQuality] = useState(1);
  
  // Get data from ESP32 using our new hook
  const [esp32Data, esp32Loading] = useESP32Data(user?.uid || null);

  useEffect(() => {
    if (!user) {
      setCurrentVitals(null);
      setHistoricalVitals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Reference for listening to real-time vital changes
    const currentVitalsRef = ref(database, `vitals/${user.uid}/current`);
    
    const unsubscribe = onValue(currentVitalsRef, (snapshot) => {
      setIsLoading(false);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentVitals(data);
        setLastUpdate(new Date(data.timestamp));
      } else {
        setCurrentVitals(null);
      }
    });

    // Fetch historical vitals (limit to last 50 entries)
    const fetchHistorical = async () => {
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
        historyUnsubscribe();
      };
    };
    
    fetchHistorical();
    
    return () => {
      unsubscribe();
    };
  }, [user]);

  // When ESP32 data changes, update vitals in Firebase
  useEffect(() => {
    if (!user || !esp32Data) return;
    
    // Convert ESP32 data to VitalSign format
    const vitals: VitalSign = {
      timestamp: esp32Data.timestamp,
      heartRate: esp32Data.heartRate,
      bloodPressure: {
        // These are placeholders since blood pressure isn't directly measured by ECG
        systolic: currentVitals?.bloodPressure?.systolic || 120,
        diastolic: currentVitals?.bloodPressure?.diastolic || 80
      },
      oxygenSaturation: esp32Data.spo2,
      temperature: esp32Data.temperature,
      // New detailed cardiac metrics
      HRV_SDNN: esp32Data.HRV_SDNN,
      HRV_RMSSD: esp32Data.HRV_RMSSD,
      RR_interval: esp32Data.RR_interval,
      QRS_width: esp32Data.QRS_width,
      PR_interval: esp32Data.PR_interval,
      QT_interval: esp32Data.QT_interval,
      ST_deviation: esp32Data.ST_deviation,
      signal_quality: esp32Data.signal_quality
    };
    
    // Update signal quality
    setSignalQuality(esp32Data.signal_quality);
    
    // Update vitals in Firebase
    const currentVitalsRef = ref(database, `vitals/${user.uid}/current`);
    set(currentVitalsRef, vitals);
    
    // Add to history every 5 minutes
    const shouldAddToHistory = !lastUpdate || 
      (new Date().getTime() - lastUpdate.getTime()) > 5 * 60 * 1000;
      
    if (shouldAddToHistory) {
      const historyRef = ref(database, `vitals/${user.uid}/history`);
      push(historyRef, vitals);
    }
    
  }, [esp32Data, user]);

  const refreshVitals = async (): Promise<void> => {
    // Nothing to do - ESP32 data is received in real-time
    // This function is kept for API compatibility
    return Promise.resolve();
  };

  return (
    <VitalsContext.Provider value={{
      currentVitals,
      historicalVitals,
      isLoading: isLoading || esp32Loading,
      lastUpdate,
      signalQuality,
      refreshVitals
    }}>
      {children}
    </VitalsContext.Provider>
  );
};
