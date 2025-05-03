import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { router } from 'expo-router';

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireCaretaker?: boolean;
  requirePatient?: boolean;
  fallbackPath?: string;
};

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  requireCaretaker = false,
  requirePatient = false,
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const { user, loading, userProfile } = useContext(AuthContext);
  const navigationInProgressRef = useRef(false);
  const hasCheckedAuthRef = useRef(false);
  
  // Ensure fallbackPath is valid
  const safeFallbackPath = typeof fallbackPath === 'string' && fallbackPath 
    ? fallbackPath 
    : '/login';
  
  useEffect(() => {
    // Only check auth once and when not loading
    if (loading || navigationInProgressRef.current || hasCheckedAuthRef.current) return;
    
    const checkAuth = async () => {
      try {
        navigationInProgressRef.current = true;
        
        // Case 1: Auth required but no user - go to login
        if (requireAuth && !user) {
          console.log('AuthGuard: No user, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // Skip role checks if profile isn't loaded yet
        if (!userProfile) {
          hasCheckedAuthRef.current = true;
          return;
        }
        
        // Case 2: User exists but needs profile setup
        if (requireAuth && user && requirePatient && 
            userProfile.isPatient && (!userProfile.age || !userProfile.gender)) {
          console.log('AuthGuard: User needs profile setup');
          router.replace('/profile-setup');
          return;
        }
        
        // Case 3: Verify user has correct role for this route
        if (requireCaretaker && !userProfile.isCaretaker) {
          // If user is not a caretaker, redirect to caretaker login
          console.log('AuthGuard: User is not a caretaker, redirecting to caretaker login');
          router.push('./caretaker-login');
          return;
        }
        
        if (requirePatient && !userProfile.isPatient) {
          // If user is not a patient, redirect to patient login
          console.log('AuthGuard: User is not a patient, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // Auth check successful
        hasCheckedAuthRef.current = true;
      } finally {
        navigationInProgressRef.current = false;
      }
    };
    
    checkAuth();
  }, [user, userProfile, loading]);

  if (loading || (!hasCheckedAuthRef.current && requireAuth)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f05545" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
});
