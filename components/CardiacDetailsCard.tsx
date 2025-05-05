import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VitalSign } from '../context/VitalsContext';

type CardiacDetailsProps = {
  vitals: VitalSign | null;
};

const CardiacDetailsCard = ({ vitals }: CardiacDetailsProps) => {
  if (!vitals) {
    return null;
  }
  
  // Check if we have advanced cardiac data
  const hasDetailedData = 
    vitals.HRV_SDNN !== undefined || 
    vitals.HRV_RMSSD !== undefined ||
    vitals.RR_interval !== undefined;
    
  if (!hasDetailedData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="heart-half" size={24} color="#f05545" />
        <Text style={styles.title}>Advanced Cardiac Metrics</Text>
      </View>
      
      <View style={styles.signalQualityContainer}>
        <Text style={styles.signalQualityLabel}>Signal Quality: </Text>
        <View style={styles.signalBars}>
          {[1, 2, 3, 4, 5].map((bar) => (
            <View 
              key={bar}
              style={[
                styles.signalBar,
                { 
                  height: bar * 4,
                  backgroundColor: (vitals.signal_quality || 0) * 5 >= bar ? '#5C6BC0' : '#e0e0e0' 
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.signalQualityValue}>
          {Math.round((vitals.signal_quality || 0) * 100)}%
        </Text>
      </View>
      
      <View style={styles.metricsGrid}>
        {vitals.HRV_SDNN !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HRV (SDNN)</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.HRV_SDNN)} ms</Text>
            <Text style={styles.metricHint}>Heart rate variability</Text>
          </View>
        )}
        
        {vitals.HRV_RMSSD !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HRV (RMSSD)</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.HRV_RMSSD)} ms</Text>
            <Text style={styles.metricHint}>Stress indicator</Text>
          </View>
        )}
        
        {vitals.RR_interval !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>RR Interval</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.RR_interval)} ms</Text>
            <Text style={styles.metricHint}>Time between beats</Text>
          </View>
        )}
        
        {vitals.QRS_width !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>QRS Width</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.QRS_width)} ms</Text>
            <Text style={styles.metricHint}>Ventricular depolarization</Text>
          </View>
        )}
        
        {vitals.PR_interval !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>PR Interval</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.PR_interval)} ms</Text>
            <Text style={styles.metricHint}>Atrial to ventricular conduction</Text>
          </View>
        )}
        
        {vitals.QT_interval !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>QT Interval</Text>
            <Text style={styles.metricValue}>{Math.round(vitals.QT_interval)} ms</Text>
            <Text style={styles.metricHint}>Ventricular action potential</Text>
          </View>
        )}
        
        {vitals.ST_deviation !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ST Deviation</Text>
            <Text style={[
              styles.metricValue,
              vitals.ST_deviation > 0.1 || vitals.ST_deviation < -0.1 
                ? styles.cautionValue : null
            ]}>
              {vitals.ST_deviation.toFixed(2)}
            </Text>
            <Text style={styles.metricHint}>Cardiac stress indicator</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.footer}>
        Data from ESP32 ECG Sensor
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  signalQualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  signalQualityLabel: {
    fontSize: 14,
    color: '#666',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 8,
  },
  signalBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  signalQualityValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  metricHint: {
    fontSize: 12,
    color: '#999',
  },
  cautionValue: {
    color: '#f05545',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  }
});

export default CardiacDetailsCard;
