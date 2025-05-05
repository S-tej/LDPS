import { database } from '../firebase/config';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hashedPassword;
};

/**
 * Check if email already exists in database
 * @param email - Email to check
 */
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    // Get all users and check manually instead of using query
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return false;
    
    const users = snapshot.val();
    // Check each user for matching email
    return Object.values(users).some((user: any) => 
      user.email.toLowerCase() === email.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking if email exists:", error);
    throw error;
  }
};

/**
 * Register a new user with email and hashed password
 * @param email - User email
 * @param password - Plain text password (will be hashed)
 * @param displayName - User's display name
 */
export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    // Check if email already exists
    if (await emailExists(email.toLowerCase())) {
      throw new Error('Email already in use');
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Generate a unique ID for the user
    const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    // Create user object
    const user = {
      uid,
      email: email.toLowerCase(),
      displayName,
      hashedPassword,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
    
    // Save to database
    await set(ref(database, `users/${uid}`), user);
    
    // Return user without password for security
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login with email and password
 * @param email - User email
 * @param password - Plain text password
 */
export const loginWithPassword = async (email: string, password: string) => {
  try {
    // Get all users and find by email
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      throw new Error('Invalid email or password');
    }
    
    const users = snapshot.val();
    let foundUser = null;
    let userId = null;
    
    // Find user with matching email
    Object.entries(users).forEach(([key, value]) => {
      const user = value as any;
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUser = user;
        userId = key;
      }
    });
    
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const hashedPassword = await hashPassword(password);
    if (foundUser.hashedPassword !== hashedPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login time
    await set(ref(database, `users/${foundUser.uid}/lastLoginAt`), Date.now());
    
    // Return user without password
    const { hashedPassword: _, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param email - User email
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    // Get all users and find by email
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      // Don't inform user that email doesn't exist (security)
      return;
    }
    
    const users = snapshot.val();
    let foundUser = null;
    
    // Find user with matching email
    Object.values(users).forEach((user: any) => {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUser = user;
      }
    });
    
    if (!foundUser) {
      // Don't inform user that email doesn't exist (security)
      return;
    }
    
    // Generate reset token
    const token = Math.random().toString(36).substring(2, 15);
    const expiration = Date.now() + 1000 * 60 * 60; // 1 hour expiration
    
    // Store reset token
    await set(ref(database, `passwordResets/${token}`), {
      userId: foundUser.uid,
      email: email.toLowerCase(),
      expiration,
      used: false
    });
    
    // In a real app, you would send an email here
    console.log(`Password reset requested for ${email}`);
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param userData - User data to update
 */
export const updateUserProfile = async (userData: any) => {
  try {
    const { uid, ...updates } = userData;
    if (!uid) throw new Error('User ID is required');
    
    // Update user data
    await set(ref(database, `users/${uid}`), updates);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Ensure user profile exists, create if missing
 * This is the function that was causing the error
 * @param user - User object with uid
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
        bloodGroup: '',
        hasBpHigh: 0,
        hasBpLow: 0,
        height: 0,
        hasDiabetes: 0,
        weight: 0,
        emergencyContacts: [],
        medicalConditions: [],
        medications: [],
      };
      
      await set(profileRef, initialProfile);
      return initialProfile;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return null;
  }
};
