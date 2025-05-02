import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { generateRandomVitals, generateRandomAlerts, generateTestDevice } from '../../utils/testDataGenerator';
import { Ionicons } from '@expo/vector-icons';

export default function TestDataScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    vitals: false,
    alerts: false,
    device: false
  });
  
  const [results, setResults] = useState<{[key: string]: any}>({});

  const handleGenerateVitals = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, vitals: true }));
    try {
      const result = await generateRandomVitals(user.uid);
      setResults(prev => ({ ...prev, vitals: result }));
    } catch (error) {
      console.error('Error generating vitals:', error);
      setResults(prev => ({ ...prev, vitals: { success: false, message: 'Failed to generate vitals' } }));
    } finally {
      setLoading(prev => ({ ...prev, vitals: false }));
    }
  };

  const handleGenerateAlerts = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, alerts: true }));
    try {
      const result = await generateRandomAlerts(user.uid);
      setResults(prev => ({ ...prev, alerts: result }));
    } catch (error) {
      console.error('Error generating alerts:', error);
      setResults(prev => ({ ...prev, alerts: { success: false, message: 'Failed to generate alerts' } }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  };

  const handleGenerateDevice = async () => {
    if (!user || !user.email) return;
    
    setLoading(prev => ({ ...prev, device: true }));
    try {
      const result = await generateTestDevice(user.uid, user.email);
      setResults(prev => ({ ...prev, device: result }));
    } catch (error) {
      console.error('Error generating device:', error);
      setResults(prev => ({ ...prev, device: { success: false, message: 'Failed to generate device' } }));
    } finally {
      setLoading(prev => ({ ...prev, device: false }));
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Test Data Generator",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Generate Test Data</Text>
          <Text style={styles.headerText}>
            Use this tool to generate random test data for your account to verify the Firebase database structure.
          </Text>
        </View>
        
        {/* Generate Vitals */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={24} color="#FF5252" />
            <Text style={styles.cardTitle}>Health Vitals</Text>
          </View>
          <Text style={styles.cardText}>
            Generate random vital sign readings including heart rate, blood pressure, oxygen levels, and ECG data.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGenerateVitals}
            disabled={loading.vitals}
          >
            {loading.vitals ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Generate Vitals</Text>
            )}
          </TouchableOpacity>
          
          {results.vitals && (
            <View style={[
              styles.resultBox, 
              {backgroundColor: results.vitals.success ? '#E8F5E9' : '#FFEBEE'}
            ]}>
              <Text style={styles.resultText}>{results.vitals.message}</Text>
            </View>
          )}
        </View>
        
        {/* Generate Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning" size={24} color="#FFC107" />
            <Text style={styles.cardTitle}>Health Alerts</Text>
          </View>
          <Text style={styles.cardText}>
            Generate random health alerts with various severity levels and acknowledgment states.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGenerateAlerts}
            disabled={loading.alerts}
          >
            {loading.alerts ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Generate Alerts</Text>
            )}
          </TouchableOpacity>
          
          {results.alerts && (
            <View style={[
              styles.resultBox, 
              {backgroundColor: results.alerts.success ? '#E8F5E9' : '#FFEBEE'}
            ]}>
              <Text style={styles.resultText}>{results.alerts.message}</Text>
            </View>
          )}
        </View>
        
        {/* Generate Device */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip" size={24} color="#5C6BC0" />
            <Text style={styles.cardTitle}>Test Device</Text>
          </View>
          <Text style={styles.cardText}>
            Create a test ECG device and associate it with your account with sample readings.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGenerateDevice}
            disabled={loading.device}
          >
            {loading.device ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Generate Device</Text>
            )}
          </TouchableOpacity>
          
          {results.device && (
            <View style={[
              styles.resultBox, 
              {backgroundColor: results.device.success ? '#E8F5E9' : '#FFEBEE'}
            ]}>
              {results.device.success ? (
                <>
                  <Text style={styles.resultText}>Device created successfully</Text>
                  <Text style={styles.resultSubtext}>Device ID: {results.device.deviceId}</Text>
                </>
              ) : (
                <Text style={styles.resultText}>{results.device.message}</Text>
              )}
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  headerText: {
    color: '#666',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  cardText: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f05545',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  resultText: {
    fontWeight: '600',
  },
  resultSubtext: {
    marginTop: 4,
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
