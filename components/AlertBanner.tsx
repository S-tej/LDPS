import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../context/AlertsContext';

type AlertBannerProps = {
  alert: Alert;
  onDismiss?: (id: string) => void;
};

const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss }) => {
  // Get styles based on alert type
  const getAlertStyle = () => {
    switch (alert.type) {
      case 'emergency':
        return {
          container: styles.emergencyContainer,
          icon: 'alert-circle',
          iconColor: 'white',
        };
      case 'critical':
        return {
          container: styles.criticalContainer,
          icon: 'warning',
          iconColor: 'white',
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          icon: 'information-circle',
          iconColor: 'white',
        };
      default:
        return {
          container: styles.infoContainer,
          icon: 'information',
          iconColor: 'white',
        };
    }
  };

  const alertStyle = getAlertStyle();
  const time = new Date(alert.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <View style={[styles.container, alertStyle.container]}>
      <View style={styles.iconContainer}>
        <Ionicons name={alertStyle.icon as any} size={24} color={alertStyle.iconColor} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => onDismiss(alert.id || '')}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  emergencyContainer: {
    backgroundColor: '#FF3B30',
  },
  criticalContainer: {
    backgroundColor: '#FF9500',
  },
  warningContainer: {
    backgroundColor: '#FFCC00',
  },
  infoContainer: {
    backgroundColor: '#34C759',
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  time: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
});

export default AlertBanner;
