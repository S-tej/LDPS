import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  AuthError,
  getAuth
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { ensureUserProfile } from '../utils/authUtils';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, isCaretaker?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName: string, userType: UserType, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  userProfile: UserProfile | null;
  authError: string | null;
};

export type UserType = 'patient' | 'caretaker';

type EmergencyContact = {
  name: string;
  relationship: string;
  phoneNumber: string;
  isCaretaker: boolean;
};

export type UserProfile = {
  userType: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  isCaretaker: boolean;
  isPatient: boolean;
  age: number;
  gender: string;
  emergencyContacts: EmergencyContact[];
  medicalConditions: string[];
  medications: string[];
  caretakers: string[]; // Always defined as an array
  patients: string[];   // Always defined as an array
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  userProfile: null,
  authError: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Load profile once when user changes
          const profileRef = ref(database, `profiles/${currentUser.uid}`);
          const snapshot = await get(profileRef);
          
          if (snapshot.exists()) {
            const profile = snapshot.val();
            
            // Ensure profile has required boolean flags
            const updatedProfile = {
              ...profile,
              isCaretaker: profile.isCaretaker ?? (profile.userType === 'caretaker'),
              isPatient: profile.isPatient ?? (profile.userType === 'patient'),
              caretakers: profile.caretakers || [],
              patients: profile.patients || []
            };
            
            // Only update database if we need to add missing fields
            if (!profile.isCaretaker && !profile.isPatient) {
              await set(ref(database, `profiles/${currentUser.uid}`), updatedProfile);
            }
            
            setUserProfile(updatedProfile as UserProfile);
          } else {
            // No profile exists, create basic one
            const basicProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || '',
              email: currentUser.email || '',
              userType: 'patient',
              isCaretaker: false,
              isPatient: true,
              age: 0,
              gender: '',
              emergencyContacts: [],
              medicalConditions: [],
              medications: [],
              caretakers: [],
              patients: []
            };
            
            await set(ref(database, `profiles/${currentUser.uid}`), basicProfile);
            setUserProfile(basicProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, isCaretaker: boolean = false) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get the user profile
      const profileRef = ref(database, `profiles/${user.uid}`);
      const snapshot = await get(profileRef);
      
      if (snapshot.exists()) {
        const profile = snapshot.val();
        
        // Check if user is trying to log in with the correct role
        const userIsCaretaker = profile.isCaretaker || profile.userType === 'caretaker';
        
        if (isCaretaker && !userIsCaretaker) {
          await signOut(auth);
          setAuthError("This account is not registered as a caretaker");
          throw new Error("This account is not registered as a caretaker");
        }
        
        if (!isCaretaker && !profile.isPatient && profile.userType !== 'patient') {
          await signOut(auth);
          setAuthError("This account is not registered as a patient");
          throw new Error("This account is not registered as a patient");
        }
        
        // Ensure profile has required boolean flags
        const updatedProfile = {
          ...profile,
          isCaretaker: profile.isCaretaker ?? (profile.userType === 'caretaker'),
          isPatient: profile.isPatient ?? (profile.userType === 'patient'),
        };
        
        setUserProfile(updatedProfile as UserProfile);
      }
      
    } catch (error: any) {
      setAuthError(getReadableAuthError(error));
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    displayName: string, 
    userType: UserType,
    phoneNumber?: string
  ) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile
      await updateProfile(userCredential.user, { displayName });
      
      // Create initial profile with boolean flags instead of string userType
      const initialProfile: UserProfile = {
        uid: userCredential.user.uid,
        displayName,
        email,
        phoneNumber: phoneNumber || '',
        // Set boolean flags based on selected user type
        isCaretaker: userType === 'caretaker',
        isPatient: userType === 'patient',
        // Keep backward compatibility
        userType,
        age: 0,
        gender: '',
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
        caretakers: [], // Always initialize as empty array
        patients: [],   // Always initialize as empty array
      };
      
      await set(ref(database, `profiles/${userCredential.user.uid}`), initialProfile);
      setUserProfile(initialProfile);
    } catch (error: any) {
      setAuthError(getReadableAuthError(error));
      throw error;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      // First clear state immediately to prevent navigation loops
      setUser(null);
      setUserProfile(null);
      setLoading(true); // Set loading to prevent immediate redirects
      
      // Then sign out from Firebase
      await signOut(auth);
      
      // Reset loading after a short delay
      setTimeout(() => {
        setLoading(false);
      }, 50);
    } catch (error) {
      setAuthError("Failed to log out");
      setLoading(false);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const updatedProfile = { ...userProfile, ...data };
      await set(ref(database, `profiles/${user.uid}`), updatedProfile);
      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      setAuthError("Failed to update profile");
      throw error;
    }
  };

  // Helper to get readable error messages
  const getReadableAuthError = (error: any): string => {
    const authError = error as AuthError;
    switch(authError.code) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/network-request-failed':
        return 'Network error - check your connection';
      default:
        return error.message || 'Authentication error occurred';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUserProfile,
      userProfile,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
