import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { VitalsContext } from '../context/VitalsContext';
import { AlertsContext } from '../context/AlertsContext';
import VitalCard from '../components/VitalCard';
import AlertBanner from '../components/AlertBanner';
import EmergencyButton from '../components/EmergencyButton';
import AuthGuard from '../components/AuthGuard';
import LogoutButton from '../components/LogoutButton';
import CardiacDetailsCard from '../components/CardiacDetailsCard';

export default function Dashboard() {
  const { user, userProfile } = useContext(AuthContext);
  const { currentVitals, lastUpdated, loading: vitalsLoading, simulateReading, signalQuality } = useContext(VitalsContext);
  const { alerts, triggerEmergency } = useContext(AlertsContext);
  const [refreshing, setRefreshing] = useState(false);

  // Demo feature - simulate data readings
  useEffect(() => {
    const interval = setInterval(() => {
      simulateReading().catch(console.error);
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await simulateReading();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Alert',
      'Do you want to trigger an emergency alert?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              await triggerEmergency('Patient initiated emergency alert');
              Alert.alert('Alert Sent', 'Emergency services and caretakers have been notified.');
            } catch (error) {
              console.error('Emergency alert error:', error);
            }
          },
        },
      ]
    );
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged).slice(0, 3);

  return (
    <AuthGuard 
      requireAuth={true} 
      requirePatient={true}
    >
      <>
        <Stack.Screen 
          options={{
            title: 'Health Dashboard',
            headerRight: () => (
              <LogoutButton 
                color="white" 
                confirmLogout={true} 
                style={{ marginRight: 8 }}
              />
            ),
          }} 
        />
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {userProfile?.displayName || user?.displayName || 'Patient'}</Text>
              <Text style={styles.subTitle}>
                {lastUpdated 
                  ? `Last updated: ${lastUpdated.toLocaleTimeString()}` 
                  : 'Monitoring your vital signs'}
              </Text>
            </View>
          </View>

          {activeAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {activeAlerts.map((alert) => (
                <AlertBanner key={alert.id} alert={alert} />
              ))}
              {alerts.filter(a => !a.acknowledged).length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllAlerts}
                  onPress={() => router.push('/alerts')}
                >
                  <Text style={styles.viewAllAlertsText}>
                    View all ({alerts.filter(a => !a.acknowledged).length}) alerts
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Vital Signs Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Vital Signs</Text>
              
              {/* Add signal indicator */}
              {currentVitals && (
                <View style={styles.signalIndicator}>
                  <View style={[
                    styles.signalDot,
                    {backgroundColor: signalQuality > 0.7 ? '#4CAF50' : 
                      (signalQuality > 0.3 ? '#FFC107' : '#F44336')}
                  ]}/>
                  <Text style={styles.signalText}>
                    {signalQuality > 0.7 ? 'Good signal' : 
                      (signalQuality > 0.3 ? 'Fair signal' : 'Poor signal')}
                  </Text>
                </View>
              )}
              
              {lastUpdated && (
                <Text style={styles.lastUpdatedText}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Text>
              )}
            </View>
            
            {vitalsLoading ? (
              <ActivityIndicator size="large" color="#f05545" style={styles.loader} />
            ) : currentVitals ? (
              <View style={styles.vitalsContainer}>
                <View style={styles.vitalRow}>
                  <View style={styles.vitalCard}>
                    <Ionicons name="heart" size={24} color="#FF5252" />
                    <Text style={styles.vitalValue}>
                      {currentVitals.heartRate}<Text style={styles.vitalUnit}> BPM</Text>
                    </Text>
                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                  </View>
                  
                  <View style={styles.vitalCard}>
                    <Ionicons name="thermometer" size={24} color="#FFA726" />
                    <Text style={styles.vitalValue}>
                      {currentVitals.temperature.toFixed(1)}<Text style={styles.vitalUnit}> °C</Text>
                    </Text>
                    <Text style={styles.vitalLabel}>Temperature</Text>
                  </View>
                </View>
                
                <View style={styles.vitalRow}>
                  <View style={styles.vitalCard}>
                    <Ionicons name="pulse" size={24} color="#5C6BC0" />
                    <Text style={styles.vitalValue}>
                      {currentVitals.bloodPressure.systolic}/{currentVitals.bloodPressure.diastolic}
                      <Text style={styles.vitalUnit}> mmHg</Text>
                    </Text>
                    <Text style={styles.vitalLabel}>Blood Pressure</Text>
                  </View>
                  
                  <View style={styles.vitalCard}>
                    <Ionicons name="water" size={24} color="#26C6DA" />
                    <Text style={styles.vitalValue}>
                      {currentVitals.oxygenSaturation}<Text style={styles.vitalUnit}> %</Text>
                    </Text>
                    <Text style={styles.vitalLabel}>Oxygen Saturation</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="pulse" size={64} color="#e0e0e0" />
                <Text style={styles.noDataText}>No ECG Data</Text>
                <Text style={styles.noDataSubtext}>
                  The ESP32 sensor is not transmitting data. Please check your device.
                </Text>
              </View>
            )}
          </View>
          
          {/* Add the new cardiac details card */}
          <CardiacDetailsCard vitals={currentVitals} />

          <View style={styles.vitalsGrid}>
            <VitalCard
              title="Heart Rate"
              value={currentVitals?.heartRate || '--'}
              unit="BPM"
              icon="heart"
              color="#FF5252"
              onPress={() => router.push('/vitals/heart-rate')}
            />
            
            <VitalCard
              title="Blood Pressure"
              value={currentVitals ? `${currentVitals.bloodPressure.systolic}/${currentVitals.bloodPressure.diastolic}` : '--/--'}
              unit="mmHg"
              icon="fitness"
              color="#5C6BC0"
              onPress={() => router.push('/vitals/blood-pressure')}
            />
            
            <VitalCard
              title="Oxygen Saturation"
              value={currentVitals?.oxygenSaturation || '--'}
              unit="%"
              icon="water"
              color="#26C6DA"
              onPress={() => router.push('/vitals/oxygen')}
            />
            
            <VitalCard
              title="Temperature"
              value={currentVitals?.temperature || '--'}
              unit="°C"
              icon="thermometer"
              color="#FFA726"
              onPress={() => router.push('/vitals/temperature')}
            />
          </View>

          <EmergencyButton onPress={handleEmergency} />

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/reports')}
            >
              <Ionicons name="document-text" size={24} color="#5C6BC0" />
              <Text style={styles.actionButtonText}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/vitals/ecg')}
            >
              <Ionicons name="pulse" size={24} color="#FF5252" />
              <Text style={styles.actionButtonText}>ECG Monitor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/caretakers')}
            >
              <Ionicons name="people" size={24} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Caretakers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings" size={24} color="#607D8B" />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
  },
  alertsContainer: {
    marginBottom: 16,
  },
  viewAllAlerts: {
    alignItems: 'center',
    padding: 8,
  },
  viewAllAlertsText: {
    color: '#f05545',
    fontWeight: '600',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#333',
  },
  signalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  signalText: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  vitalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  vitalUnit: {
    fontSize: 12,
    color: '#888',
  },
});
