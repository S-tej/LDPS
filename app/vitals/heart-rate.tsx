import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';
import { Ionicons } from '@expo/vector-icons';

export default function HeartRateScreen() {
  const { currentVitals, historicalVitals, thresholds } = useContext(VitalsContext);
  
  // Extract heart rate data for chart
  const chartData = historicalVitals
    .slice(0, 20)
    .map(v => v.heartRate)
    .reverse();
  
  const times = historicalVitals
    .slice(0, 20)
    .map(v => {
      const date = new Date(v.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    })
    .reverse();
  
  const isHigh = currentVitals && currentVitals.heartRate > thresholds.heartRateHigh;
  const isLow = currentVitals && currentVitals.heartRate < thresholds.heartRateLow;
  const status = isHigh ? 'High' : isLow ? 'Low' : 'Normal';
  const statusColor = isHigh ? '#FF5252' : isLow ? '#FFC107' : '#4CAF50';
  
  return (
    <>
      <Stack.Screen options={{ title: "Heart Rate" }} />
      <ScrollView style={styles.container}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Current Heart Rate</Text>
          
          <View style={styles.currentValueContainer}>
            <Ionicons name="heart" size={40} color="#FF5252" />
            <Text style={styles.currentValue}>
              {currentVitals?.heartRate || '--'}
              <Text style={styles.unit}> BPM</Text>
            </Text>
          </View>
          
          <View style={[styles.statusContainer, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
          
          <View style={styles.rangeContainer}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Low</Text>
              <Text style={styles.rangeValue}>&lt; {thresholds.heartRateLow}</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Normal</Text>
              <Text style={styles.rangeValue}>{thresholds.heartRateLow} - {thresholds.heartRateHigh}</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>High</Text>
              <Text style={styles.rangeValue}>&gt; {thresholds.heartRateHigh}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>History</Text>
          
          {chartData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0), // Show fewer labels for clarity
                datasets: [{ data: chartData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#FF5252',
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No heart rate history available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Information</Text>
          <Text style={styles.infoText}>
            Your heart rate is the number of times your heart beats per minute. A normal resting heart rate for adults ranges from 60 to 100 beats per minute.
          </Text>
          <Text style={styles.infoText}>
            Athletes and people who are very physically fit may have resting heart rates as low as 40 BPM.
          </Text>
        </View>
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
  cardContainer: {
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  unit: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontWeight: 'bold',
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeLabel: {
    color: '#666',
    marginBottom: 4,
  },
  rangeValue: {
    fontWeight: 'bold',
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
  },
  noDataText: {
    color: '#666',
  },
  infoText: {
    lineHeight: 20,
    color: '#555',
    marginBottom: 12,
  },
});
