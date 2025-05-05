import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerUser,
  loginWithPassword,
  sendPasswordResetEmail as sendResetEmail,
  updateUserProfile as updateProfile,
  ensureUserProfile
} from '../utils/customAuthUtils'; // Fixed path to point to utils directory
import { router } from 'expo-router';

type AuthContextType = {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  userProfile: UserProfile | null;
  authError: string | null;
  sendPasswordResetEmail: (email: string) => Promise<void>;
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
  sendPasswordResetEmail: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);
  
  // Session timeout in milliseconds (1 minutes)
  const SESSION_TIMEOUT = 1 * 60 * 1000;

  // Check for stored user session on startup
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        // Get minimal user session info from AsyncStorage
        const userIdJson = await AsyncStorage.getItem('currentUserId');
        const lastActiveTime = await AsyncStorage.getItem('lastActiveTime');
        
        if (userIdJson && lastActiveTime) {
          const now = Date.now();
          const lastActive = parseInt(lastActiveTime, 10);
          
          // If session hasn't expired, restore the user from database
          if (now - lastActive < SESSION_TIMEOUT) {
            const userId = JSON.parse(userIdJson);
            
            // Get fresh user data from database
            const userSnapshot = await get(ref(database, `users/${userId}`));
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              // Remove password hash for security
              const { hashedPassword, ...userWithoutPassword } = userData;
              setUser(userWithoutPassword);
              
              // Update the last active time
              await AsyncStorage.setItem('lastActiveTime', now.toString());
              
              // Load user profile
              await fetchUserProfile(userId);
            } else {
              // User no longer exists in database
              await AsyncStorage.multiRemove(['currentUserId', 'lastActiveTime']);
            }
          } else {
            // Session expired, clear storage
            await AsyncStorage.multiRemove(['currentUserId', 'lastActiveTime']);
          }
        }
      } catch (error) {
        console.error("Error loading stored user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredUser();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Handle app state changes (active, background, inactive)
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      // App is going to background
      backgroundTimeRef.current = Date.now();
      
      // Store the current time as last active time
      if (user) {
        await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
      }
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming back to foreground
      if (backgroundTimeRef.current && user) {
        const now = Date.now();
        const timeInBackground = now - backgroundTimeRef.current;
        
        // If the app was in background for longer than the timeout period, logout
        if (timeInBackground > SESSION_TIMEOUT) {
          logout();
        } else {
          // Update the last active time
          await AsyncStorage.setItem('lastActiveTime', now.toString());
        }
      }
    }
    
    appState.current = nextAppState;
  };

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
      const loggedInUser = await loginWithPassword(email, password);
      
      // Store minimal user info in AsyncStorage (just ID)
      setUser(loggedInUser);
      await AsyncStorage.setItem('currentUserId', JSON.stringify(loggedInUser.uid));
      await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
      
      // Fetch user profile
      await fetchUserProfile(loggedInUser.uid);
      
      // Explicitly navigate to dashboard after successful login
      router.replace('/dashboard');
      return loggedInUser;
    } catch (error: any) {
      setAuthError(error.message || "Login failed");
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    try {
      const newUser = await registerUser(email, password, displayName);
      
      // Store minimal user info in AsyncStorage (just ID)
      setUser(newUser);
      await AsyncStorage.setItem('currentUserId', JSON.stringify(newUser.uid));
      await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
      
      // Create initial profile
      const initialProfile: UserProfile = {
        uid: newUser.uid,
        displayName,
        age: 0,
        gender: '',
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
      };
      
      await set(ref(database, `profiles/${newUser.uid}`), initialProfile);
      setUserProfile(initialProfile);
      
      // After successful registration, navigate to profile setup
      router.push('/profile-setup');
    } catch (error: any) {
      setAuthError(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      // Clear user from state and AsyncStorage
      setUser(null);
      setUserProfile(null);
      await AsyncStorage.multiRemove(['currentUserId', 'lastActiveTime']);
      router.replace('/login');
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

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await sendResetEmail(email);
    } catch (error: any) {
      setAuthError(error.message || "Failed to send reset email");
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
      authError,
      sendPasswordResetEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};