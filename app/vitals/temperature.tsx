import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';
import { Ionicons } from '@expo/vector-icons';

export default function TemperatureScreen() {
  const { currentVitals, historicalVitals, thresholds } = useContext(VitalsContext);
  
  // Extract temperature data for chart
  const tempData = historicalVitals
    .slice(0, 20)
    .map(v => v.temperature)
    .reverse();
  
  const times = historicalVitals
    .slice(0, 20)
    .map(v => {
      const date = new Date(v.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    })
    .reverse();
  
  const isHigh = currentVitals && currentVitals.temperature > thresholds.temperatureHigh;
  const isLow = currentVitals && currentVitals.temperature < thresholds.temperatureLow;
  const status = isHigh ? 'High' : isLow ? 'Low' : 'Normal';
  const statusColor = isHigh ? '#FF5252' : isLow ? '#FFC107' : '#4CAF50';
  
  return (
    <>
      <Stack.Screen options={{ title: "Body Temperature" }} />
      <ScrollView style={styles.container}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Current Temperature</Text>
          
          <View style={styles.currentValueContainer}>
            <Ionicons name="thermometer" size={40} color="#FFA726" />
            <Text style={styles.currentValue}>
              {currentVitals?.temperature.toFixed(1) || '--'}
              <Text style={styles.unit}>°C</Text>
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
              <Text style={styles.rangeValue}>&lt; {thresholds.temperatureLow}°C</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Normal</Text>
              <Text style={styles.rangeValue}>{thresholds.temperatureLow} - {thresholds.temperatureHigh}°C</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>High</Text>
              <Text style={styles.rangeValue}>&gt; {thresholds.temperatureHigh}°C</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>History</Text>
          
          {tempData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0), // Show fewer labels for clarity
                datasets: [{ data: tempData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#FFA726',
                },
              }}
              bezier
              style={styles.chart}
              yAxisSuffix="°C"
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No temperature history available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Information</Text>
          <Text style={styles.infoText}>
            Body temperature is a measure of your body's ability to generate and get rid of heat.
          </Text>
          <Text style={styles.infoText}>
            Normal body temperature is typically around 36.5°C to 37.5°C (97.7°F to 99.5°F).
          </Text>
          <Text style={styles.infoText}>
            A temperature over 38°C (100.4°F) is usually considered a fever. Elderly patients may have lower baseline temperatures, and fever thresholds may need to be adjusted accordingly.
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
    fontSize: 24,
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
