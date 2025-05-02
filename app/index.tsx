import React, { useContext, useEffect } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function Index() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, user]);

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
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  loading: {
    marginTop: 20,
  },
});
