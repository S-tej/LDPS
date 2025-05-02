import React, { useContext, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { router } from 'expo-router';

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectToLogin?: boolean;
  redirectPath?: string;
};

/**
 * Component that protects routes based on authentication state
 */
export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectToLogin = true,
  redirectPath = '/login'
}: AuthGuardProps) {
  const { user, loading } = useContext(AuthContext);
  
  useEffect(() => {
    if (!loading) {
      // If auth is required but user is not logged in
      if (requireAuth && !user) {
        if (redirectToLogin) {
          router.replace('/login');
        }
      } 
      // If auth should not be present (like login page) but user is logged in
      else if (!requireAuth && user) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, requireAuth]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f05545" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }
  
  // If we require auth and have a user, or don't require auth and have no user
  if ((requireAuth && user) || (!requireAuth && !user)) {
    return <>{children}</>;
  }
  
  // This will briefly show while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f05545" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  }
});
