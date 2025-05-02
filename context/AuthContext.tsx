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
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
      const profileRef = ref(database, `profiles/${uid}`);
      const snapshot = await get(profileRef);
      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
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
      await set(ref(database, `profiles/${user.uid}`), updatedProfile);
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
      userProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
