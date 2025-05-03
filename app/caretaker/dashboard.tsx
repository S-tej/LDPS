import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/config';
import LogoutButton from '../../components/LogoutButton';
import AuthGuard from '../../components/AuthGuard';

type PatientInfo = {
  uid: string;
  displayName: string;
  age: number;
  gender: string;
  lastActivity?: number;
};

export default function CaretakerDashboard() {
  const { user, userProfile, logout } = useContext(AuthContext);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && userProfile?.patients) {
      fetchPatients();
    } else {
      setLoading(false);
    }
  }, [user, userProfile]);

  const fetchPatients = async () => {
    try {
      if (!userProfile?.patients?.length) {
        setPatients([]);
        setLoading(false);
        return;
      }

      const patientProfiles: PatientInfo[] = [];
      
      for (const patientId of userProfile.patients) {
        const patientRef = ref(database, `profiles/${patientId}`);
        const snapshot = await get(patientRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Get last activity
          const lastActivityRef = ref(database, `vitals/${patientId}/current/timestamp`);
          const activitySnapshot = await get(lastActivityRef);
          
          patientProfiles.push({
            uid: patientId,
            displayName: data.displayName || 'Unknown',
            age: data.age || 0,
            gender: data.gender || 'Unknown',
            lastActivity: activitySnapshot.exists() ? activitySnapshot.val() : undefined
          });
        }
      }
      
      setPatients(patientProfiles);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to minutes
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    // Convert to days
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <AuthGuard 
      requireAuth={true} 
      requireCaretaker={true}
    >
      <>
        <Stack.Screen 
          options={{
            title: 'Caretaker Dashboard',
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
            <Text style={styles.welcomeText}>
              Welcome, {userProfile?.displayName || 'Caretaker'}
            </Text>
            <Text style={styles.subtitle}>
              You are monitoring {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5C6BC0" />
              <Text style={styles.loadingText}>Loading patients...</Text>
            </View>
          ) : patients.length > 0 ? (
            <View style={styles.patientsContainer}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.uid}
                  style={styles.patientCard}
                  onPress={() => router.push(`/caretaker/patient/${patient.uid}`)}
                >
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.displayName}</Text>
                    <Text style={styles.patientDetails}>
                      {patient.age > 0 ? `${patient.age} years • ` : ''}{patient.gender}
                    </Text>
                    <View style={styles.lastSeenContainer}>
                      <Ionicons 
                        name="time-outline" 
                        size={14} 
                        color="#888" 
                        style={styles.lastSeenIcon}
                      />
                      <Text style={styles.lastSeenText}>
                        Last activity: {formatLastSeen(patient.lastActivity)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No patients found</Text>
              <Text style={styles.emptySubtext}>
                You don't have any patients yet. Your patients need to add you as a caretaker using your phone number.
              </Text>
            </View>
          )}
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
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  patientsContainer: {
    marginBottom: 16,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lastSeenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lastSeenIcon: {
    marginRight: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  logoutButton: {
    paddingHorizontal: 16,
  },
});
