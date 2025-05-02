import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { AlertsContext } from '../context/AlertsContext';
import AlertBanner from '../components/AlertBanner';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const { alerts, acknowledgeAlert, clearAlert } = useContext(AlertsContext);
  
  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const pastAlerts = alerts.filter(alert => alert.acknowledged);

  const handleDismiss = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const handleClear = (alertId: string) => {
    clearAlert(alertId);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Health Alerts" }} />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
          </Text>
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItemContainer}>
                <AlertBanner alert={alert} />
                <TouchableOpacity 
                  style={styles.dismissButton}
                  onPress={() => handleDismiss(alert.id!)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.dismissText}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.emptyStateText}>No active alerts</Text>
            </View>
          )}
        </View>

        {pastAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Past Alerts ({pastAlerts.length})
            </Text>
            {pastAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItemContainer}>
                <AlertBanner alert={alert} />
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => handleClear(alert.id!)}
                >
                  <Ionicons name="trash-bin" size={16} color="#777" />
                  <Text style={styles.clearText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  alertItemContainer: {
    marginBottom: 16,
  },
  dismissButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  dismissText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  clearText: {
    color: '#777',
    marginLeft: 4,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
