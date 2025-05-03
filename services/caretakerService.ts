import { database } from '../firebase/config';
import { 
  ref, 
  get, 
  set, 
  query, 
  orderByChild, 
  equalTo, 
  update,
  child
} from 'firebase/database';

export type Caretaker = {
  uid: string;
  displayName: string;
  phoneNumber: string;
  email: string;
  isCaretaker: boolean;
  patients?: string[];
};

export type Patient = {
  uid: string;
  displayName: string;
  email: string;
  isPatient: boolean;
  caretakers?: string[];
};

/**
 * Find a caretaker by phone number
 * @param phoneNumber - The phone number to search for
 * @returns The caretaker profile if found, null otherwise
 */
export const findCaretakerByPhone = async (phoneNumber: string): Promise<Caretaker | null> => {
  try {
    // Query user profiles where phoneNumber matches and isCaretaker is true
    const profilesRef = ref(database, 'profiles');
    const phoneQuery = query(
      profilesRef,
      orderByChild('phoneNumber'),
      equalTo(phoneNumber)
    );
    
    const snapshot = await get(phoneQuery);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    // Process results
    const profiles = snapshot.val();
    const uids = Object.keys(profiles);
    
    // Find the first profile that is a caretaker
    for (const uid of uids) {
      const profile = profiles[uid];
      if (profile.isCaretaker) {
        return {
          uid,
          displayName: profile.displayName,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
          isCaretaker: profile.isCaretaker,
          patients: profile.patients || []
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding caretaker by phone:', error);
    throw error;
  }
};

/**
 * Link a patient to a caretaker
 * @param patientUid - The patient's user ID
 * @param caretakerUid - The caretaker's user ID
 */
export const linkPatientToCaretaker = async (patientUid: string, caretakerUid: string): Promise<void> => {
  try {
    // Get patient profile
    const patientRef = ref(database, `profiles/${patientUid}`);
    const patientSnapshot = await get(patientRef);
    
    if (!patientSnapshot.exists()) {
      throw new Error('Patient profile not found');
    }
    
    const patientProfile = patientSnapshot.val();
    
    // Get caretaker profile
    const caretakerRef = ref(database, `profiles/${caretakerUid}`);
    const caretakerSnapshot = await get(caretakerRef);
    
    if (!caretakerSnapshot.exists()) {
      throw new Error('Caretaker profile not found');
    }
    
    const caretakerProfile = caretakerSnapshot.val();
    
    // Check if already linked
    const patientCaretakers = patientProfile.caretakers || [];
    const caretakerPatients = caretakerProfile.patients || [];
    
    if (patientCaretakers.includes(caretakerUid)) {
      throw new Error('Caretaker is already linked to this patient');
    }
    
    // Update both records atomically
    const updates: Record<string, any> = {};
    
    // Add caretaker to patient's caretakers list
    updates[`profiles/${patientUid}/caretakers`] = [...patientCaretakers, caretakerUid];
    
    // Add patient to caretaker's patients list
    updates[`profiles/${caretakerUid}/patients`] = [...caretakerPatients, patientUid];
    
    // Execute the updates
    await update(ref(database), updates);
  } catch (error) {
    console.error('Error linking patient to caretaker:', error);
    throw error;
  }
};

/**
 * Unlink a patient from a caretaker
 * @param patientUid - The patient's user ID
 * @param caretakerUid - The caretaker's user ID
 */
export const unlinkPatientFromCaretaker = async (patientUid: string, caretakerUid: string): Promise<void> => {
  try {
    // Get patient profile
    const patientRef = ref(database, `profiles/${patientUid}`);
    const patientSnapshot = await get(patientRef);
    
    if (!patientSnapshot.exists()) {
      throw new Error('Patient profile not found');
    }
    
    const patientProfile = patientSnapshot.val();
    
    // Get caretaker profile
    const caretakerRef = ref(database, `profiles/${caretakerUid}`);
    const caretakerSnapshot = await get(caretakerRef);
    
    if (!caretakerSnapshot.exists()) {
      throw new Error('Caretaker profile not found');
    }
    
    const caretakerProfile = caretakerSnapshot.val();
    
    // Update both records atomically
    const updates: Record<string, any> = {};
    
    // Remove caretaker from patient's caretakers list
    const updatedCaretakers = (patientProfile.caretakers || []).filter(
      (id: string) => id !== caretakerUid
    );
    updates[`profiles/${patientUid}/caretakers`] = updatedCaretakers;
    
    // Remove patient from caretaker's patients list
    const updatedPatients = (caretakerProfile.patients || []).filter(
      (id: string) => id !== patientUid
    );
    updates[`profiles/${caretakerUid}/patients`] = updatedPatients;
    
    // Execute the updates
    await update(ref(database), updates);
  } catch (error) {
    console.error('Error unlinking patient from caretaker:', error);
    throw error;
  }
};

/**
 * Get all caretakers for a patient
 * @param patientUid - The patient's user ID
 * @returns An array of caretakers
 */
export const getPatientCaretakers = async (patientUid: string): Promise<Caretaker[]> => {
  try {
    // Get patient profile
    const patientRef = ref(database, `profiles/${patientUid}`);
    const patientSnapshot = await get(patientRef);
    
    if (!patientSnapshot.exists()) {
      throw new Error('Patient profile not found');
    }
    
    const patientProfile = patientSnapshot.val();
    const caretakerIds = patientProfile.caretakers || [];
    
    if (caretakerIds.length === 0) {
      return [];
    }
    
    // Fetch each caretaker profile
    const caretakers: Caretaker[] = [];
    for (const caretakerId of caretakerIds) {
      const caretakerRef = ref(database, `profiles/${caretakerId}`);
      const caretakerSnapshot = await get(caretakerRef);
      
      if (caretakerSnapshot.exists()) {
        const profile = caretakerSnapshot.val();
        caretakers.push({
          uid: caretakerId,
          displayName: profile.displayName,
          phoneNumber: profile.phoneNumber || '',
          email: profile.email,
          isCaretaker: profile.isCaretaker,
          patients: profile.patients || []
        });
      }
    }
    
    return caretakers;
  } catch (error) {
    console.error('Error getting patient caretakers:', error);
    throw error;
  }
};
