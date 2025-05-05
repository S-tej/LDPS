import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../firebase/config';
import { ref, get, set } from 'firebase/database';

/**
 * Check if user has completed their profile setup
 * @param uid - User ID
 * @returns Promise resolving to boolean indicating if profile is complete
 */
export const isProfileComplete = async (uid: string): Promise<boolean> => {
  try {
    const profileRef = ref(database, `profiles/${uid}`);
    const snapshot = await get(profileRef);
    
    if (!snapshot.exists()) return false;
    
    const profile = snapshot.val();
    // Check if essential fields are filled
    return Boolean(
      profile.age && 
      profile.gender
    );
  } catch (error) {
    console.error("Error checking profile completion:", error);
    return false;
  }
};

/**
 * Get user profile data
 * @param uid - User ID
 * @returns Promise resolving to user profile or null
 */
export const getUserProfile = async (uid: string) => {
  try {
    const profileRef = ref(database, `profiles/${uid}`);
    const snapshot = await get(profileRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * Ensure user profile exists, create if missing
 * @param user - User object
 */
export const ensureUserProfile = async (user: any) => {
  try {
    const profileRef = ref(database, `profiles/${user.uid}`);
    const snapshot = await get(profileRef);
    
    // If profile doesn't exist, create a basic one
    if (!snapshot.exists()) {
      const initialProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        age: 0,
        gender: '',
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
      };
      
      await set(profileRef, initialProfile);
      return initialProfile;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return null;
  }
};

/**
 * Get current authenticated user from local storage (replaces Firebase Auth)
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem('currentUser');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};