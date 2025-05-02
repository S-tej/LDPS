import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';
import { Ionicons } from '@expo/vector-icons';

export default function ECGScreen() {
  const { currentVitals } = useContext(VitalsContext);
  const [ecgData, setEcgData] = useState<number[]>([]);
  const router = useRouter();
  
  // Update ECG data when currentVitals changes
  useEffect(() => {
    if (currentVitals?.ecgData) {
      setEcgData(prev => {
        // Keep a sliding window of data points
        const newData = [...prev, ...currentVitals.ecgData!];
        if (newData.length > 200) {
          return newData.slice(newData.length - 200);
        }
        return newData;
      });
    }
  }, [currentVitals]);

  return (
    <>
      <Stack.Screen options={{ title: "ECG Monitor" }} />
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Real-time ECG</Text>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => router.push('/vitals/ecg-details')}
            >
              <Text style={styles.detailsButtonText}>Advanced View</Text>
              <Ionicons name="chevron-forward" size={16} color="#5C6BC0" />
            </TouchableOpacity>
          </View>
          
          {ecgData.length > 0 ? (
            <LineChart
              data={{
                labels: [],
                datasets: [{ data: ecgData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '0',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                }
              }}
              bezier
              style={styles.chart}
              withDots={false}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLines={true}
              withVerticalLines={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Waiting for ECG data...</Text>
            </View>
          )}
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Heart Rate:</Text>
              <Text style={styles.infoValue}>{currentVitals?.heartRate || '--'} BPM</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rhythm:</Text>
              <Text style={styles.infoValue}>
                {currentVitals?.ecgMetrics?.HRV_SDNN && currentVitals.ecgMetrics.HRV_SDNN > 50 
                  ? "Normal Sinus" 
                  : currentVitals?.ecgMetrics?.HRV_SDNN 
                    ? "Regular" 
                    : "Unknown"}
              </Text>
            </View>
          </View>

          {currentVitals?.ecgMetrics && (
            <View style={styles.quickMetricsContainer}>
              <View style={styles.quickMetricItem}>
                <Text style={styles.quickMetricLabel}>HRV:</Text>
                <Text style={styles.quickMetricValue}>{currentVitals.ecgMetrics.HRV_SDNN} ms</Text>
              </View>
              
              <View style={styles.quickMetricItem}>
                <Text style={styles.quickMetricLabel}>RR:</Text>
                <Text style={styles.quickMetricValue}>{currentVitals.ecgMetrics.RR_interval} ms</Text>
              </View>
              
              <View style={styles.quickMetricItem}>
                <Text style={[
                  styles.quickMetricValue,
                  Math.abs(currentVitals.ecgMetrics.ST_deviation) > 0.1 ? styles.abnormalValue : {}
                ]}>
                  {currentVitals.ecgMetrics.ST_deviation.toFixed(2)} mV
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
            <Text style={styles.legendText}>ECG Signal</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#5C6BC0',
    fontWeight: '500',
    marginRight: 4
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  noDataText: {
    color: '#666',
  },
  infoContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'column',
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickMetricsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  quickMetricItem: {
    alignItems: 'center',
  },
  quickMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  quickMetricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  abnormalValue: {
    color: '#FF5252',
  },
  legendContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    color: '#333',
  }
});
