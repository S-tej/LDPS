import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function Index() {
  const { user, userProfile, loading } = useContext(AuthContext);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // If already loading or already redirected, don't proceed
    if (loading || hasRedirectedRef.current) return;
    
    // Mark as redirected to prevent multiple redirects
    hasRedirectedRef.current = true;
    
    // Simple redirect logic
    if (!user) {
      // No authenticated user, go to unified login
      router.replace('/unified-login');
    } else if (userProfile) {
      // User is authenticated with profile, go to appropriate dashboard
      if (userProfile.isCaretaker) {
        router.replace('/caretaker/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } else {
      // User is authenticated but no profile, default to patient dashboard
      router.replace('/dashboard');
    }
  }, [loading, user, userProfile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lonely Death Prevention System</Text>
      <Text style={styles.subtitle}>Caring for your loved ones remotely</Text>
      <ActivityIndicator size="large" color="#f05545" style={styles.loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  loading: {
    marginTop: 20,
  },
});
