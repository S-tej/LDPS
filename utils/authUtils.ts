import { auth, database } from '../firebase/config';
import { User } from 'firebase/auth';
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
 * @param user - Firebase user
 */
export const ensureUserProfile = async (user: User) => {
  try {
    const profileRef = ref(database, `profiles/${user.uid}`);
    const snapshot = await get(profileRef);
    
    // If profile doesn't exist, create a basic one
    if (!snapshot.exists()) {
      // Default to patient type for new users
      const initialProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        age: 0,
        gender: '',
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
        caretakers: [],
        patients: [],
        userType: 'patient',
        isCaretaker: false,
        isPatient: true
      };
      
      await set(profileRef, initialProfile);
      return initialProfile;
    }
    
    // If profile exists but doesn't have boolean flags, add them
    const profile = snapshot.val();
    if (!('isCaretaker' in profile) || !('isPatient' in profile)) {
      const userType = profile.userType || 'patient';
      const updatedProfile = {
        ...profile,
        isCaretaker: userType === 'caretaker',
        isPatient: userType === 'patient'
      };
      await set(profileRef, updatedProfile);
      return updatedProfile;
    }
    
    return profile;
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return null;
  }
};

/**
 * Get current authenticated user
 * @returns Current Firebase user or null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};