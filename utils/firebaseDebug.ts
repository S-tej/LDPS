import { database } from '../firebase/config';
import { ref, set, get, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tests the Firebase realtime database connection
 * @returns A promise with connection status and error details if applicable
 */
export const testDatabaseConnection = async () => {
  try {
    // Test path that should be accessible without authentication
    const testPath = 'connection_test';
    const timestamp = Date.now();
    
    // Try to write test data
    await set(ref(database, `${testPath}/${timestamp}`), {
      timestamp,
      message: 'Test connection'
    });
    
    // Try to read the test data
    const snapshot = await get(ref(database, `${testPath}/${timestamp}`));
    
    if (snapshot.exists()) {
      console.log('✅ Firebase database connection successful');
      return { success: true, data: snapshot.val() };
    } else {
      console.error('❌ Firebase database connection failed: Data not found after write');
      return { 
        success: false, 
        error: 'Data not found after write',
        errorCode: 'DATA_NOT_FOUND'
      };
    }
  } catch (error: any) {
    console.error('❌ Firebase database connection failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      errorCode: error.code || 'UNKNOWN_ERROR',
      fullError: error
    };
  }
};

/**
 * Monitor database connectivity
 * @param callback Function called on connectivity status change
 */
export const monitorConnectivity = (callback: (isConnected: boolean) => void) => {
  const connectedRef = ref(database, '.info/connected');
  
  const unsubscribe = onValue(connectedRef, (snap) => {
    const isConnected = !!snap.val();
    callback(isConnected);
    console.log(`📡 Firebase database connectivity: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
  });
  
  return unsubscribe;
};

/**
 * Get detailed Firebase app information for debugging
 */
export const getFirebaseDebugInfo = async () => {
  try {
    // Get current user ID from AsyncStorage
    const userIdJson = await AsyncStorage.getItem('currentUserId');
    let currentUser = null;
    
    // If we have a user ID, get complete user data from database
    if (userIdJson) {
      const userId = JSON.parse(userIdJson);
      const userSnapshot = await get(ref(database, `users/${userId}`));
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        // Remove sensitive data
        const { hashedPassword, ...userInfo } = userData;
        currentUser = userInfo;
      }
    }
    
    return {
      currentUser: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
      } : null,
      databaseInitialized: !!database,
      databaseURL: database.app.options.databaseURL,
      appName: database.app.name,
      appOptions: database.app.options,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
