import { database, auth } from '../firebase/config';
import { ref, set, get, onValue } from 'firebase/database';

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
export const getFirebaseDebugInfo = () => {
  try {
    return {
      authInitialized: !!auth,
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        isAnonymous: auth.currentUser.isAnonymous,
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
