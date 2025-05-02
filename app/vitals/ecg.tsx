import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';

export default function ECGScreen() {
  const { currentVitals } = useContext(VitalsContext);
  const [ecgData, setEcgData] = useState<number[]>([]);
  
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
          <Text style={styles.title}>Real-time ECG</Text>
          
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
              <Text style={styles.infoValue}>Normal Sinus</Text>
            </View>
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
  },
});
