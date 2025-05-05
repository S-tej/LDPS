import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
};

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const { user, loading, userProfile } = useContext(AuthContext);
  const navigationInProgressRef = useRef(false);
  const hasCheckedAuthRef = useRef(false);
  const currentPath = usePathname();
  
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
          if (currentPath !== '/login') {
            router.replace('/login');
          }
          return;
        }
        
        // Skip role checks if profile isn't loaded yet
        if (!userProfile) {
          console.log('AuthGuard: Profile not loaded yet');
          hasCheckedAuthRef.current = true;
          return;
        }
        
        // Case 2: User exists but needs profile setup
        if (requireAuth && user && (!userProfile.age || !userProfile.gender)) {
          console.log('AuthGuard: User needs profile setup');
          if (currentPath !== '/profile-setup') {
            router.replace('/profile-setup');
          }
          return;
        }
        
        // Auth check successful
        hasCheckedAuthRef.current = true;
      } finally {
        navigationInProgressRef.current = false;
      }
    };
    
    checkAuth();
  }, [user, userProfile, loading, currentPath]);

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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
