import { ref, push, set, update } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Generate random health vital sign readings
 * @param userId - The user's ID to generate data for
 * @param count - Number of historical readings to generate
 */
export const generateRandomVitals = async (userId: string, count = 10) => {
  try {
    // Generate the current vitals reading
    const currentVitals = generateVitalSign();
    
    // Save current vitals
    await set(ref(database, `vitals/${userId}/current`), currentVitals);
    
    // Generate historical vitals
    const historyRef = ref(database, `vitals/${userId}/history`);
    
    // Add multiple historical entries at different timestamps
    for (let i = 0; i < count; i++) {
      const pastTime = Date.now() - (i * 1000 * 60 * 30); // 30 minutes intervals
      const historicalVital = generateVitalSign(pastTime);
      await push(historyRef, historicalVital);
    }
    
    // Set up default thresholds if they don't exist
    const thresholds = {
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
    
    await set(ref(database, `vitals/${userId}/thresholds`), thresholds);
    
    return { 
      success: true, 
      message: `Generated ${count} historical readings and current vitals` 
    };
  } catch (error) {
    console.error("Failed to generate random vitals:", error);
    return { 
      success: false, 
      message: "Error generating test data" 
    };
  }
};

/**
 * Generate a single set of vital signs
 * @param timestamp - Optional timestamp to use
 */
const generateVitalSign = (timestamp = Date.now()) => {
  // Generate ECG waveform data
  const ecgPoints = [];
  for (let i = 0; i < 50; i++) {
    // Simplified ECG pattern generation
    const baseValue = 0.8;
    const peak = i % 10 === 5 ? 0.6 : 0;
    ecgPoints.push(baseValue + peak + (Math.random() * 0.1));
  }
  
  // Random values with healthy defaults
  const heartRate = randomInRange(60, 100);
  
  return {
    timestamp,
    heartRate,
    bloodPressure: {
      systolic: randomInRange(110, 140),
      diastolic: randomInRange(70, 90)
    },
    oxygenSaturation: randomInRange(94, 100),
    temperature: parseFloat(randomInRange(36.5, 37.2).toFixed(1)),
    ecgData: ecgPoints,
    ecgMetrics: {
      HRV_SDNN: randomInRange(20, 70),
      HRV_RMSSD: randomInRange(15, 50),
      RR_interval: Math.floor(60000 / heartRate), // Convert BPM to RR interval in ms
      QRS_width: randomInRange(70, 120),
      PR_interval: randomInRange(120, 200),
      QT_interval: randomInRange(350, 450),
      ST_deviation: (Math.random() * 2 - 1) * 0.2, // Between -0.2 and 0.2
      signal_quality: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) // 0.7 to 1.0
    }
  };
};

/**
 * Generate random alerts for testing
 * @param userId - The user's ID to generate alerts for
 * @param count - Number of alerts to generate
 */
export const generateRandomAlerts = async (userId: string, count = 5) => {
  try {
    const alertsRef = ref(database, `alerts/${userId}`);
    
    const alertTypes = ['warning', 'critical', 'info', 'emergency'];
    const messages = [
      'High heart rate detected',
      'Low blood oxygen level',
      'Abnormal ECG pattern detected',
      'High blood pressure detected',
      'Elevated body temperature',
      'Irregular heart rhythm detected',
      'Low heart rate detected',
      'Emergency button pressed'
    ];
    
    const vitalSigns = [
      'heartRate',
      'bloodPressure',
      'oxygenSaturation',
      'temperature',
      'ecg'
    ];
    
    // Generate alerts with varying types and acknowledgement status
    for (let i = 0; i < count; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = Date.now() - (i * 1000 * 60 * randomInRange(5, 120));
      
      // Randomize whether older alerts are acknowledged
      const acknowledged = i > 1 && Math.random() > 0.5;
      
      const alert = {
        type: alertType,
        message,
        timestamp,
        acknowledged,
        vitalSign: vitalSigns[Math.floor(Math.random() * vitalSigns.length)],
        value: alertType === 'emergency' ? undefined : randomInRange(60, 180)
      };
      
      await push(alertsRef, alert);
    }
    
    // Create a notification for the most recent alert
    await push(ref(database, `notifications/caretakers/${userId}`), {
      timestamp: Date.now() - 1000 * 60,
      patientId: userId,
      alertType: 'warning',
      message: 'High heart rate detected: 115 BPM',
      read: false
    });
    
    return {
      success: true,
      message: `Generated ${count} test alerts`
    };
  } catch (error) {
    console.error("Failed to generate random alerts:", error);
    return {
      success: false,
      message: "Error generating test alerts"
    };
  }
};

/**
 * Create test devices for a user
 * @param userId - The user's ID
 * @param userEmail - The user's email
 */
export const generateTestDevice = async (userId: string, userEmail: string) => {
  try {
    // Create a unique device ID
    const deviceId = `ESP32_ECG_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const timestamp = Date.now();
    
    // Create the device in Firebase
    const deviceRef = ref(database, `devices`);
    const newDeviceRef = push(deviceRef);
    
    // Set device data
    await set(newDeviceRef, {
      deviceId,
      deviceType: 'ESP32_ECG',
      dateAdded: timestamp,
      assigned: true,
      assignedTo: userEmail,
      userId: userId,
      assignedAt: timestamp,
      lastActive: timestamp
    });
    
    const deviceKey = newDeviceRef.key;
    
    // Create some ECG data for the device
    await generateECGData(deviceId, timestamp);
    
    return {
      success: true,
      deviceId,
      deviceKey
    };
  } catch (error) {
    console.error("Failed to create test device:", error);
    return {
      success: false,
      message: "Error creating test device"
    };
  }
};

/**
 * Generate ECG data for a device
 * @param deviceId - The device ID
 * @param timestamp - Timestamp for the data
 */
export const generateECGData = async (deviceId: string, timestamp = Date.now()) => {
  try {
    const sampleCount = 250;
    const samplingRate = 250; // Hz
    
    // Generate ECG waveform data
    const ecgData = [];
    for (let i = 0; i < sampleCount; i++) {
      const timeInCycle = (i % 50) / 50; // 0-1 range within cycle
      
      // Basic PQRST wave simulation
      let value = 0;
      
      // P wave
      if (timeInCycle < 0.2) {
        value = 0.25 * Math.sin(timeInCycle * Math.PI / 0.2);
      }
      // QRS complex
      else if (timeInCycle < 0.35) {
        if (timeInCycle < 0.27) {
          value = -0.5 * Math.sin(timeInCycle * Math.PI / 0.1); // Q
        } else if (timeInCycle < 0.32) {
          value = 2 * Math.sin(timeInCycle * Math.PI / 0.1); // R
        } else {
          value = -0.3 * Math.sin(timeInCycle * Math.PI / 0.1); // S
        }
      }
      // T wave
      else if (timeInCycle < 0.7) {
        value = 0.75 * Math.sin((timeInCycle - 0.35) * Math.PI / 0.35);
      }
      
      // Add some noise
      value += (Math.random() - 0.5) * 0.1;
      
      ecgData.push({
        time: timestamp + (i * (1000 / samplingRate)),
        value
      });
    }
    
    // Calculate heart rate
    const heartRate = randomInRange(60, 100);
    
    // Create metadata
    const metadata = {
      deviceID: deviceId,
      samplingRate: samplingRate,
      uploadTime: timestamp,
      samplesCount: sampleCount,
      dcOffset: 0,
      gainFactor: 1,
      ecgMetrics: {
        HRV_SDNN: randomInRange(20, 70),
        HRV_RMSSD: randomInRange(15, 50),
        RR_interval: Math.floor(60000 / heartRate),
        QRS_width: randomInRange(70, 120),
        PR_interval: randomInRange(120, 200),
        QT_interval: randomInRange(350, 450),
        ST_deviation: (Math.random() * 2 - 1) * 0.1,
        signal_quality: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2))
      },
      heartRate,
      temperature: parseFloat(randomInRange(36.5, 37.2).toFixed(1)),
      oxygenSaturation: randomInRange(94, 100)
    };
    
    // Save to Firebase
    await set(ref(database, `ecg_data/${deviceId}/${timestamp}`), {
      data: ecgData,
      metadata
    });
    
    return {
      success: true,
      timestamp
    };
  } catch (error) {
    console.error("Failed to generate ECG data:", error);
    return {
      success: false,
      message: "Error generating ECG data"
    };
  }
};

/**
 * Utility function for random number in range
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
