import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';
import { Ionicons } from '@expo/vector-icons';

export default function OxygenScreen() {
  const { currentVitals, historicalVitals, thresholds } = useContext(VitalsContext);
  
  // Extract oxygen data for chart
  const oxygenData = historicalVitals
    .slice(0, 20)
    .map(v => v.oxygenSaturation)
    .reverse();
  
  const times = historicalVitals
    .slice(0, 20)
    .map(v => {
      const date = new Date(v.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    })
    .reverse();
  
  const isLow = currentVitals && currentVitals.oxygenSaturation < thresholds.oxygenSaturationLow;
  const status = isLow ? 'Low' : 'Normal';
  const statusColor = isLow ? '#FFC107' : '#4CAF50';
  
  return (
    <>
      <Stack.Screen options={{ title: "Oxygen Saturation" }} />
      <ScrollView style={styles.container}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Current SpO₂ Level</Text>
          
          <View style={styles.currentValueContainer}>
            <Ionicons name="water" size={40} color="#26C6DA" />
            <Text style={styles.currentValue}>
              {currentVitals?.oxygenSaturation || '--'}
              <Text style={styles.unit}>%</Text>
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
              <Text style={styles.rangeValue}>&lt; {thresholds.oxygenSaturationLow}%</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Normal</Text>
              <Text style={styles.rangeValue}>{thresholds.oxygenSaturationLow}% - 100%</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>History</Text>
          
          {oxygenData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0), // Show fewer labels for clarity
                datasets: [{ data: oxygenData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(38, 198, 218, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#26C6DA',
                },
              }}
              bezier
              style={styles.chart}
              fromZero={false}
              yAxisSuffix="%"
              yAxisInterval={5}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No oxygen level history available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Information</Text>
          <Text style={styles.infoText}>
            Oxygen saturation (SpO₂) is a measure of how much oxygen your blood is carrying as a percentage of the maximum it could carry.
          </Text>
          <Text style={styles.infoText}>
            Normal SpO₂ levels are typically between 95-100%. Levels below 92% may indicate hypoxemia (low blood oxygen).
          </Text>
          <Text style={styles.infoText}>
            If your SpO₂ readings are consistently below 92%, please consult with your healthcare provider immediately.
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
    justifyContent: 'space-evenly',
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
