import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  limitToLast, 
  push 
} from 'firebase/database';

/**
 * Write data to the database with enhanced error handling
 * @param path - The database path to write to
 * @param data - The data to write
 */
export const writeData = async (path: string, data: any) => {
  try {
    if (!database) {
      throw new Error('Firebase database not initialized');
    }
    
    if (!path) {
      throw new Error('Invalid database path');
    }
    
    await set(ref(database, path), data);
    return { success: true };
  } catch (error: any) {
    console.error(`Error writing data to ${path}:`, error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      path 
    };
  }
};

/**
 * Read data from the database once with enhanced error handling
 * @param path - The database path to read from
 */
export const readData = async (path: string) => {
  try {
    if (!database) {
      throw new Error('Firebase database not initialized');
    }

    if (!path) {
      throw new Error('Invalid database path');
    }
    
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log(`No data available at path: ${path}`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error reading data from ${path}:`, error);
    throw error;
  }
};

/**
 * Update data in the database
 * @param path - The database path to update
 * @param data - The data to update (will be merged with existing data)
 */
export const updateData = async (path: string, data: any) => {
  try {
    await update(ref(database, path), data);
    return true;
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

/**
 * Listen for real-time updates on a database path
 * @param path - The database path to watch
 * @param callback - Function to call when data changes
 * @returns The unsubscribe function to stop listening
 */
export const subscribeToData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(database, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  // Return the unsubscribe function
  return () => off(dataRef);
};

/**
 * Generate a new unique key for a database path
 * @param path - The database path where the key will be used
 */
export const generateKey = (path: string) => {
  return push(ref(database, path)).key;
};

/**
 * Get the latest items from a path, ordered by a child property
 * @param path - The database path
 * @param orderBy - The child property to order by
 * @param limit - Maximum number of items to return
 */
export const getLatestItems = async (path: string, orderBy: string, limit: number) => {
  try {
    const itemsQuery = query(
      ref(database, path),
      orderByChild(orderBy),
      limitToLast(limit)
    );
    
    const snapshot = await get(itemsQuery);
    if (snapshot.exists()) {
      // Convert to array and reverse to get newest first
      const items: any[] = [];
      snapshot.forEach((child) => {
        items.unshift({ id: child.key, ...child.val() });
      });
      return items;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting latest items:', error);
    throw error;
  }
};
