import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../../context/AuthContext';
import { ref, get, onValue } from 'firebase/database';
import { database } from '../../../firebase/config';
import LogoutButton from '../../../components/LogoutButton';

type PatientVitals = {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturation: number;
  temperature: number;
  timestamp: number;
};

type PatientProfile = {
  displayName: string;
  age: number;
  gender: string;
  medicalConditions?: string[];
  medications?: string[];
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [patientVitals, setPatientVitals] = useState<PatientVitals | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (id) {
      const profileRef = ref(database, `profiles/${id}`);
      const profileUnsubscribe = onValue(profileRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPatientProfile({
            displayName: data.displayName,
            age: data.age || 0,
            gender: data.gender || 'Unknown',
            medicalConditions: data.medicalConditions || [],
            medications: data.medications || [],
          });
        } else {
          Alert.alert('Error', 'Patient not found');
          router.back();
        }
      });

      const vitalsRef = ref(database, `vitals/${id}/current`);
      const vitalsUnsubscribe = onValue(vitalsRef, (snapshot) => {
        setLoading(false);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPatientVitals(data);
          setLastUpdated(new Date(data.timestamp));
        }
      });

      return () => {
        profileUnsubscribe();
        vitalsUnsubscribe();
      };
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C6BC0" />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: patientProfile?.displayName || 'Patient Details',
          headerBackTitle: 'Back',
          headerRight: () => <LogoutButton color="white" />
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileCard}>
          <Text style={styles.patientName}>{patientProfile?.displayName}</Text>
          <Text style={styles.patientDetails}>
            {patientProfile?.age > 0 ? `${patientProfile.age} years • ` : ''}{patientProfile?.gender}
          </Text>
          
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Current Vitals</Text>
        
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalCard}>
            <Ionicons name="heart" size={24} color="#FF5252" />
            <Text style={styles.vitalValue}>
              {patientVitals?.heartRate || '--'}<Text style={styles.vitalUnit}> BPM</Text>
            </Text>
            <Text style={styles.vitalTitle}>Heart Rate</Text>
          </View>
          
          <View style={styles.vitalCard}>
            <Ionicons name="fitness" size={24} color="#5C6BC0" />
            <Text style={styles.vitalValue}>
              {patientVitals ? `${patientVitals.bloodPressure.systolic}/${patientVitals.bloodPressure.diastolic}` : '--/--'}
              <Text style={styles.vitalUnit}> mmHg</Text>
            </Text>
            <Text style={styles.vitalTitle}>Blood Pressure</Text>
          </View>
          
          <View style={styles.vitalCard}>
            <Ionicons name="water" size={24} color="#26C6DA" />
            <Text style={styles.vitalValue}>
              {patientVitals?.oxygenSaturation || '--'}<Text style={styles.vitalUnit}> %</Text>
            </Text>
            <Text style={styles.vitalTitle}>Oxygen Saturation</Text>
          </View>
          
          <View style={styles.vitalCard}>
            <Ionicons name="thermometer" size={24} color="#FFA726" />
            <Text style={styles.vitalValue}>
              {patientVitals?.temperature || '--'}<Text style={styles.vitalUnit}> °C</Text>
            </Text>
            <Text style={styles.vitalTitle}>Temperature</Text>
          </View>
        </View>
        
        {(patientProfile?.medicalConditions?.length || patientProfile?.medications?.length) ? (
          <>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            
            {patientProfile?.medicalConditions?.length ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Medical Conditions</Text>
                {patientProfile.medicalConditions.map((condition, index) => (
                  <View key={index} style={styles.infoItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#5C6BC0" />
                    <Text style={styles.infoText}>{condition}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            
            {patientProfile?.medications?.length ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Medications</Text>
                {patientProfile.medications.map((medication, index) => (
                  <View key={index} style={styles.infoItem}>
                    <Ionicons name="medkit" size={16} color="#5C6BC0" />
                    <Text style={styles.infoText}>{medication}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.emergencyButtonText}>Contact Patient</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.historyButton}>
            <Ionicons name="analytics" size={24} color="#5C6BC0" />
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  profileCard: {
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
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  vitalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%', // Two cards per row
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vitalTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  vitalUnit: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'column',
    marginTop: 16,
  },
  emergencyButton: {
    backgroundColor: '#f05545',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  historyButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5C6BC0',
  },
  historyButtonText: {
    color: '#5C6BC0',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
