import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { writeData, readData, generateKey } from '../../utils/realtimeDbUtils';
import { AuthContext } from '../../context/AuthContext';
import { assignDeviceToUser, unassignDevice, getUserDevices } from '../../utils/deviceUtils';
import { generateECGData } from '../../utils/ecgDataGenerator';
import { Ionicons } from '@expo/vector-icons';

// Matches the Firebase device structure
interface Device {
  id: string;
  deviceId: string;
  deviceType: string;
  dateAdded: number;
  assigned: boolean;
  assignedTo?: string;
  userId?: string;
  lastActive?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingData, setGeneratingData] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    
    loadDevices();
  }, [user]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // Get user's devices and unassigned devices
      const data = await readData('devices');
      
      if (data) {
        // Convert object to array and only show user's devices or unassigned devices
        const deviceArray = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(device => !device.assigned || device.userId === user?.uid);
          
        setDevices(deviceArray);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async () => {
    if (!newDeviceId.trim()) {
      Alert.alert('Error', 'Please enter a device ID');
      return;
    }

    // Check for duplicates
    if (devices.some(device => device.deviceId === newDeviceId)) {
      Alert.alert('Error', 'This device ID already exists');
      return;
    }

    try {
      // Generate a key for devices/{deviceId}
      const deviceKey = generateKey('devices');
      
      const newDevice = {
        deviceId: newDeviceId.trim(),
        deviceType: 'ESP32_ECG', // Default to ECG device type
        dateAdded: Date.now(),
        assigned: false,
        lastActive: null
      };

      await writeData(`devices/${deviceKey}`, newDevice);
      
      // Refresh the device list
      setNewDeviceId('');
      loadDevices();
      
      Alert.alert('Success', 'Device added successfully');
    } catch (error) {
      console.error('Failed to add device:', error);
      Alert.alert('Error', 'Failed to add device');
    }
  };

  const handleAssignToMe = async (deviceId: string) => {
    if (!user) return;
    
    try {
      await assignDeviceToUser(deviceId, user.uid, user.email || '');
      loadDevices();
      Alert.alert('Success', 'Device assigned to you successfully');
    } catch (error) {
      console.error('Failed to assign device:', error);
      Alert.alert('Error', 'Failed to assign device');
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    Alert.alert(
      'Unassign Device',
      'Are you sure you want to unassign this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unassign', 
          style: 'destructive',
          onPress: async () => {
            try {
              await unassignDevice(deviceId);
              loadDevices();
              Alert.alert('Success', 'Device unassigned successfully');
            } catch (error) {
              console.error('Failed to unassign device:', error);
              Alert.alert('Error', 'Failed to unassign device');
            }
          }
        }
      ]
    );
  };

  const handleSimulateData = async (deviceInfo: Device) => {
    try {
      setGeneratingData(deviceInfo.id);
      await generateECGData(deviceInfo.deviceId);
      Alert.alert('Success', 'Generated ECG data for device');
    } catch (error) {
      console.error('Failed to generate data:', error);
      Alert.alert('Error', 'Failed to generate data');
    } finally {
      setGeneratingData(null);
      loadDevices(); // Refresh to show updated lastActive time
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceId}>{item.deviceId}</Text>
        <Text style={styles.deviceMeta}>
          Type: {item.deviceType} | Added: {new Date(item.dateAdded).toLocaleDateString()}
        </Text>
        <Text style={styles.deviceStatus}>
          Status: {item.assigned ? 'Assigned' : 'Unassigned'}
        </Text>
        {item.lastActive && (
          <Text style={styles.deviceMeta}>
            Last Active: {new Date(item.lastActive).toLocaleString()}
          </Text>
        )}
        {item.heartRate && (
          <Text style={styles.deviceReadings}>
            HR: {item.heartRate} BPM | O2: {item.oxygenSaturation}% | Temp: {item.temperature?.toFixed(1)}°C
          </Text>
        )}
      </View>
      <View style={styles.deviceActions}>
        {!item.assigned ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAssignToMe(item.id)}
          >
            <Ionicons name="person-add" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : item.userId === user?.uid && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { marginRight: 8 }]}
              onPress={() => handleSimulateData(item)}
              disabled={generatingData === item.id}
            >
              {generatingData === item.id ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="pulse" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUnassignDevice(item.id)}
            >
              <Ionicons name="person-remove" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ 
        title: "My Devices",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ),
      }} />
      
      <View style={styles.container}>
        <View style={styles.addDeviceContainer}>
          <Text style={styles.sectionTitle}>Register New Device</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Device ID"
              value={newDeviceId}
              onChangeText={setNewDeviceId}
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addDevice}
            >
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>My Devices</Text>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5C6BC0" />
            <Text style={styles.loadingText}>Loading devices...</Text>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={renderDevice}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text>No devices found. Register your first device above.</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  addDeviceContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 4,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deviceItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceMeta: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  deviceStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  deviceAssignee: {
    fontSize: 14,
    color: '#444',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
    marginLeft: 8,
  },
  deviceReadings: {
    color: '#5C6BC0',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  }
});
