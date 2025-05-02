import { ref, push, set } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Generate and save simulated ECG data for a device
 * @param deviceId - The device ID
 * @param sampleCount - Number of samples to generate
 */
export const generateECGData = async (deviceId: string, sampleCount = 250) => {
  try {
    const now = Date.now();
    const samplingRate = 250; // 250 Hz
    
    // Generate ECG waveform data
    const ecgData = [];
    for (let i = 0; i < sampleCount; i++) {
      // Generate realistic ECG pattern
      const timeInCycle = (i % 50) / 50; // Normalize to 0-1 range in cycle
      
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
        time: now + (i * (1000 / samplingRate)),
        value
      });
    }
    
    // Calculate ECG metrics
    const heartRate = 60 + Math.floor(Math.random() * 40); // 60-100 BPM
    const hrv = 20 + Math.floor(Math.random() * 50); // 20-70 ms
    
    // Create metadata
    const metadata = {
      deviceID: deviceId,
      samplingRate: samplingRate,
      uploadTime: now,
      samplesCount: sampleCount,
      dcOffset: 0,
      gainFactor: 1,
      ecgMetrics: {
        HRV_SDNN: hrv,
        HRV_RMSSD: Math.floor(hrv * 0.8),
        RR_interval: Math.floor(60000 / heartRate),
        QRS_width: 80 + Math.floor(Math.random() * 40),
        PR_interval: 120 + Math.floor(Math.random() * 80),
        QT_interval: 350 + Math.floor(Math.random() * 100),
        ST_deviation: (Math.random() * 2 - 1) * 0.1,
        signal_quality: 0.7 + Math.random() * 0.3
      },
      heartRate,
      temperature: 36.5 + Math.random(),
      oxygenSaturation: 95 + Math.floor(Math.random() * 5)
    };
    
    // Save to Firebase at ecg_data/{deviceId}/{timestamp}
    const ecgRef = ref(database, `ecg_data/${deviceId}/${now}`);
    await set(ecgRef, {
      data: ecgData,
      metadata
    });
    
    return {
      timestamp: now,
      sampleCount,
      heartRate
    };
  } catch (error) {
    console.error('Error generating ECG data:', error);
    throw error;
  }
};
