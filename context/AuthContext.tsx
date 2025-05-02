import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../firebase/config';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  userProfile: UserProfile | null;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
};

// Match the Firebase structure for user profiles
type UserProfile = {
  displayName: string;
  email: string;
  age?: number;
  gender?: string;
  medicalConditions: string[];
  medications: string[];
  emergencyContacts: EmergencyContact[];
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
  isNewUser: false,
  setIsNewUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      // Update path to match the schema: users/{userId}
      const profileRef = ref(database, `users/${uid}`);
      const snapshot = await get(profileRef);
      if (snapshot.exists()) {
        const profile = snapshot.val();
        setUserProfile(profile);
        
        // Check if profile is incomplete
        const isProfileIncomplete = 
          !profile.age || 
          !profile.gender || 
          (profile.medicalConditions && profile.medicalConditions.length === 0);
        
        setIsNewUser(isProfileIncomplete);
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      
      // Create initial profile under users/{userId}
      const initialProfile: UserProfile = {
        displayName,
        email,
        medicalConditions: [],
        medications: [],
        emergencyContacts: []
      };
      
      await set(ref(database, `users/${userCredential.user.uid}`), initialProfile);
      setUserProfile(initialProfile);
      setIsNewUser(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const updatedProfile = { ...userProfile, ...data };
      // Update path to match schema: users/{userId}
      await set(ref(database, `users/${user.uid}`), updatedProfile);
      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      throw error;
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
      isNewUser,
      setIsNewUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
