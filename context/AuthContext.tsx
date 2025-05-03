import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { ensureUserProfile } from '../utils/authUtils';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  userProfile: UserProfile | null;
  authError: string | null;
};

type UserProfile = {
  uid: string;
  displayName: string;
  age: number;
  gender: string;
  emergencyContacts: EmergencyContact[];
  medicalConditions: string[];
  medications: string[];
};

type EmergencyContact = {
  name: string;
  relationship: string;
  phoneNumber: string;
  isCaretaker: boolean;
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
          await fetchUserProfile(currentUser.uid);
        } catch (error) {
          console.error("Error in auth state change:", error);
          // Try to recover by ensuring profile exists
          const profile = await ensureUserProfile(currentUser);
          if (profile) {
            setUserProfile(profile as UserProfile);
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const profileRef = ref(database, `profiles/${uid}`);
      const snapshot = await get(profileRef);
      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
      } else {
        // Create a default profile if none exists
        if (user) {
          const profile = await ensureUserProfile(user);
          if (profile) {
            setUserProfile(profile as UserProfile);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setAuthError("Failed to load user profile");
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(getReadableAuthError(error));
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      
      // Create initial profile
      const initialProfile: UserProfile = {
        uid: userCredential.user.uid,
        displayName,
        age: 0,
        gender: '',
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
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
      await signOut(auth);
    } catch (error) {
      setAuthError("Failed to log out");
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