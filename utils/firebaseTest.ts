import { database } from '../firebase/config';
import { ref, set, get } from 'firebase/database';

export const testFirebaseConnection = async () => {
  try {
    // Write test data
    await set(ref(database, 'test/connection'), {
      timestamp: Date.now(),
      status: 'success'
    });
    
    // Read test data
    const snapshot = await get(ref(database, 'test/connection'));
    if (snapshot.exists()) {
      console.log('Firebase connection successful:', snapshot.val());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};
