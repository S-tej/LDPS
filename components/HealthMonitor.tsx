import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subscribeToData, updateData } from '../utils/realtimeDbUtils';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function HealthMonitor() {
  interface HealthData {
    latestReading?: {
      value: number;
      timestamp: number;
    };
  }

  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to real-time updates for this user's health data
    const unsubscribe = subscribeToData(`healthData/${user.uid}`, (data) => {
      setHealthData(data);
      console.log('Received real-time health data update:', data);
    });
    
    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [user]);
  
  // Example function to update health data
  const updateHealthReading = async (reading: number) => {
    if (!user) return;
    
    try {
      await updateData(`healthData/${user.uid}/latestReading`, {
        value: reading,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error updating health reading:', error);
    }
  };
  
  // Render component with real-time data
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Monitor</Text>
      {healthData ? (
        <View>
          <Text>Latest Reading: {healthData.latestReading?.value}</Text>
          <Text>Updated: {healthData.latestReading?.timestamp ? new Date(healthData.latestReading.timestamp).toLocaleString() : 'No data available'}</Text>
        </View>
      ) : (
        <Text>Loading health data...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  }
});
