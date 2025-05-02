import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';
import { Ionicons } from '@expo/vector-icons';

export default function BloodPressureScreen() {
  const { currentVitals, historicalVitals, thresholds } = useContext(VitalsContext);
  
  // Extract systolic data for chart
  const systolicData = historicalVitals
    .slice(0, 20)
    .map(v => v.bloodPressure.systolic)
    .reverse();
  
  // Extract diastolic data for chart
  const diastolicData = historicalVitals
    .slice(0, 20)
    .map(v => v.bloodPressure.diastolic)
    .reverse();
  
  const times = historicalVitals
    .slice(0, 20)
    .map(v => {
      const date = new Date(v.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    })
    .reverse();
  
  const isHigh = currentVitals && (
    currentVitals.bloodPressure.systolic > thresholds.bloodPressureHigh.systolic || 
    currentVitals.bloodPressure.diastolic > thresholds.bloodPressureHigh.diastolic
  );
  
  const isLow = currentVitals && (
    currentVitals.bloodPressure.systolic < thresholds.bloodPressureLow.systolic || 
    currentVitals.bloodPressure.diastolic < thresholds.bloodPressureLow.diastolic
  );
  
  const status = isHigh ? 'High' : isLow ? 'Low' : 'Normal';
  const statusColor = isHigh ? '#FF5252' : isLow ? '#FFC107' : '#4CAF50';
  
  return (
    <>
      <Stack.Screen options={{ title: "Blood Pressure" }} />
      <ScrollView style={styles.container}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Current Blood Pressure</Text>
          
          <View style={styles.currentValueContainer}>
            <Ionicons name="fitness" size={40} color="#5C6BC0" />
            <View style={styles.bpContainer}>
              <Text style={styles.currentValue}>
                {currentVitals ? currentVitals.bloodPressure.systolic : '--'}
                <Text style={styles.unit}> SYS</Text>
              </Text>
              <View style={styles.separator} />
              <Text style={styles.currentValue}>
                {currentVitals ? currentVitals.bloodPressure.diastolic : '--'}
                <Text style={styles.unit}> DIA</Text>
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusContainer, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
          
          <View style={styles.rangeContainer}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Low</Text>
              <Text style={styles.rangeValue}>&lt; {thresholds.bloodPressureLow.systolic}/{thresholds.bloodPressureLow.diastolic}</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Normal</Text>
              <Text style={styles.rangeValue}>{thresholds.bloodPressureLow.systolic}-{thresholds.bloodPressureHigh.systolic}/{thresholds.bloodPressureLow.diastolic}-{thresholds.bloodPressureHigh.diastolic}</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>High</Text>
              <Text style={styles.rangeValue}>&gt; {thresholds.bloodPressureHigh.systolic}/{thresholds.bloodPressureHigh.diastolic}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>History</Text>
          
          {systolicData.length > 0 && diastolicData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0), // Show fewer labels for clarity
                datasets: [
                  { 
                    data: systolicData,
                    color: (opacity = 1) => `rgba(92, 107, 192, ${opacity})`,
                    strokeWidth: 2
                  },
                  { 
                    data: diastolicData,
                    color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`,
                    strokeWidth: 2
                  }
                ],
                legend: ['Systolic', 'Diastolic']
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '1'
                },
              }}
              bezier
              style={styles.chart}
              fromZero
              verticalLabelRotation={30}
              segments={5}
              withDots
              withShadow
              withInnerLines
              withOuterLines
              withVerticalLabels
              withHorizontalLabels
              withLegend
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No blood pressure history available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Information</Text>
          <Text style={styles.infoText}>
            Blood pressure is measured using two values: systolic pressure (SYS) and diastolic pressure (DIA). 
            It is written as systolic/diastolic, for example 120/80 mmHg.
          </Text>
          <Text style={styles.infoText}>
            - Normal: Less than 120/80 mmHg
          </Text>
          <Text style={styles.infoText}>
            - Elevated: 120-129/Less than 80 mmHg
          </Text>
          <Text style={styles.infoText}>
            - Stage 1 Hypertension: 130-139/80-89 mmHg
          </Text>
          <Text style={styles.infoText}>
            - Stage 2 Hypertension: 140 or higher/90 or higher mmHg
          </Text>
          <Text style={styles.infoText}>
            - Hypertensive Crisis: Higher than 180/Higher than 120 mmHg
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
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  separator: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  unit: {
    fontSize: 14,
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
    fontSize: 12,
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
