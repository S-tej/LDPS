import { writeData, readData, updateData } from './realtimeDbUtils';

/**
 * Get all available devices
 */
export const getAvailableDevices = async () => {
  try {
    // Read from devices/
    const devices = await readData('devices');
    if (!devices) return [];
    
    // Filter to get only unassigned devices
    return Object.keys(devices)
      .filter(key => !devices[key].assigned)
      .map(key => ({
        id: key,
        ...devices[key]
      }));
  } catch (error) {
    console.error('Error getting available devices:', error);
    throw error;
  }
};

/**
 * Assign a device to a user
 * @param deviceId - The database key for the device
 * @param userId - The user's ID
 * @param userEmail - The user's email for display
 */
export const assignDeviceToUser = async (deviceId: string, userId: string, userEmail: string) => {
  try {
    // Check if user already has a device assigned
    const userDevices = await getUserDevices(userId);
    
    // Allow multiple devices per user
    
    // Update device at devices/{deviceId}
    await updateData(`devices/${deviceId}`, {
      assigned: true,
      assignedTo: userEmail,
      userId: userId,
      assignedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error assigning device:', error);
    throw error;
  }
};

/**
 * Unassign a device from a user
 * @param deviceId - The database key for the device
 */
export const unassignDevice = async (deviceId: string) => {
  try {
    // Update device at devices/{deviceId}
    await updateData(`devices/${deviceId}`, {
      assigned: false,
      assignedTo: null,
      userId: null,
      assignedAt: null
    });
    return true;
  } catch (error) {
    console.error('Error unassigning device:', error);
    throw error;
  }
};

/**
 * Get devices assigned to a specific user
 * @param userId - The user's ID
 */
export const getUserDevices = async (userId: string) => {
  try {
    // Read from devices/
    const devices = await readData('devices');
    if (!devices) return [];
    
    return Object.keys(devices)
      .filter(key => devices[key].assigned && devices[key].userId === userId)
      .map(key => ({
        id: key,
        ...devices[key]
      }));
  } catch (error) {
    console.error('Error getting user devices:', error);
    throw error;
  }
};

/**
 * Get the latest ECG data for a device
 * @param deviceId - The device ID
 * @param limit - Maximum number of data points to return
 */
export const getLatestECGData = async (deviceId: string, limit = 100) => {
  try {
    // Read from ecg_data/{deviceId}
    const data = await readData(`ecg_data/${deviceId}`);
    if (!data) return null;
    
    // Get the keys and sort them (these are timestamps)
    const keys = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a));
    
    // Get the most recent data
    const latestKey = keys[0];
    if (!latestKey) return null;
    
    // Return the latest ECG data
    const ecgData = data[latestKey];
    
    // Update the last active time for the device at devices/{deviceId}
    const deviceRef = await readData(`devices`);
    if (deviceRef) {
      // Find the device by deviceId
      const deviceKey = Object.keys(deviceRef).find(
        key => deviceRef[key].deviceId === deviceId
      );
      
      if (deviceKey) {
        await updateData(`devices/${deviceKey}`, {
          lastActive: Date.now(),
          // Add heartRate to the device data for quick reference
          heartRate: ecgData.metadata?.heartRate || null,
          temperature: ecgData.metadata?.temperature || null,
          oxygenSaturation: ecgData.metadata?.oxygenSaturation || null
        });
      }
    }
    
    return ecgData;
  } catch (error) {
    console.error('Error getting ECG data:', error);
    throw error;
  }
};
