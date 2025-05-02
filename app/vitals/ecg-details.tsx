import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { VitalsContext } from '../../context/VitalsContext';

export default function ECGDetailsScreen() {
  const { currentVitals, historicalVitals } = useContext(VitalsContext);
  const [hrvData, setHrvData] = useState<number[]>([]);
  const [rrData, setRrData] = useState<number[]>([]);
  const [stData, setStData] = useState<number[]>([]);
  
  // Extract time points for x-axis
  const times = historicalVitals
    .slice(0, 20)
    .map(v => {
      const date = new Date(v.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    })
    .reverse();
  
  useEffect(() => {
    if (historicalVitals && historicalVitals.length > 0) {
      // Extract HRV_SDNN data for chart
      const hrvValues = historicalVitals
        .slice(0, 20)
        .map(v => v.ecgMetrics?.HRV_SDNN || 0)
        .filter(v => v > 0)
        .reverse();
      
      // Extract RR interval data
      const rrValues = historicalVitals
        .slice(0, 20)
        .map(v => v.ecgMetrics?.RR_interval || 0)
        .filter(v => v > 0)
        .reverse();
      
      // Extract ST deviation data
      const stValues = historicalVitals
        .slice(0, 20)
        .map(v => v.ecgMetrics?.ST_deviation || 0)
        .reverse();
      
      setHrvData(hrvValues);
      setRrData(rrValues);
      setStData(stValues);
    }
  }, [historicalVitals]);

  return (
    <>
      <Stack.Screen options={{ title: "ECG Analysis" }} />
      <ScrollView style={styles.container}>
        {/* HRV Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Heart Rate Variability (SDNN)</Text>
          
          {hrvData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0),
                datasets: [{ data: hrvData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(92, 107, 192, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#5C6BC0' }
              }}
              bezier
              style={styles.chart}
              yAxisSuffix=" ms"
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No HRV data available</Text>
            </View>
          )}
          
          <Text style={styles.infoText}>
            Heart Rate Variability (SDNN) is the standard deviation of time between heartbeats.
            Higher values typically indicate better cardiovascular health and autonomic nervous system function.
          </Text>
        </View>

        {/* RR Interval Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.title}>RR Interval</Text>
          
          {rrData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0),
                datasets: [{ data: rrData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#FFA726' }
              }}
              bezier
              style={styles.chart}
              yAxisSuffix=" ms"
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No RR interval data available</Text>
            </View>
          )}
          
          <Text style={styles.infoText}>
            RR interval is the time between successive heartbeats.
            Normal values range from 600-1200ms, corresponding to a heart rate of 50-100 BPM.
            Irregularities may indicate arrhythmias.
          </Text>
        </View>

        {/* ST Deviation Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.title}>ST Segment Deviation</Text>
          
          {stData.length > 0 ? (
            <LineChart
              data={{
                labels: times.filter((_, i) => i % 4 === 0),
                datasets: [{ data: stData }]
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#F44336' }
              }}
              bezier
              style={styles.chart}
              yAxisSuffix=" mV"
              fromZero={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No ST deviation data available</Text>
            </View>
          )}
          
          <Text style={styles.infoText}>
            ST segment deviation can indicate myocardial ischemia or injury.
            Elevation above 0.1mV or depression below -0.1mV may be significant.
            Persistent abnormalities should be evaluated by a healthcare provider.
          </Text>
        </View>
        
        {/* Current ECG Metrics Summary */}
        {currentVitals && currentVitals.ecgMetrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.title}>Current ECG Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>QRS Width:</Text>
              <Text style={styles.metricValue}>
                {currentVitals.ecgMetrics.QRS_width} ms
                <Text style={styles.metricNotes}>
                  {currentVitals.ecgMetrics.QRS_width > 120 ? " (Widened)" : " (Normal)"}
                </Text>
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>PR Interval:</Text>
              <Text style={styles.metricValue}>
                {currentVitals.ecgMetrics.PR_interval} ms
                <Text style={styles.metricNotes}>
                  {currentVitals.ecgMetrics.PR_interval > 200 ? " (Prolonged)" : 
                   currentVitals.ecgMetrics.PR_interval < 120 ? " (Short)" : " (Normal)"}
                </Text>
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>QT Interval:</Text>
              <Text style={styles.metricValue}>
                {currentVitals.ecgMetrics.QT_interval} ms
                <Text style={styles.metricNotes}>
                  {currentVitals.ecgMetrics.QT_interval > 450 ? " (Prolonged)" : " (Normal)"}
                </Text>
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Heart Rate Variability:</Text>
              <Text style={styles.metricValue}>
                SDNN: {currentVitals.ecgMetrics.HRV_SDNN} ms | 
                RMSSD: {currentVitals.ecgMetrics.HRV_RMSSD} ms
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Signal Quality:</Text>
              <Text style={[
                styles.metricValue, 
                {color: currentVitals.ecgMetrics.signal_quality >= 0.7 ? '#4CAF50' : '#FF5252'}
              ]}>
                {(currentVitals.ecgMetrics.signal_quality * 100).toFixed(0)}%
              </Text>
            </View>
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
  chartContainer: {
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
  infoText: {
    lineHeight: 20,
    color: '#555',
    marginTop: 12,
  },
  metricsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricLabel: {
    fontSize: 16,
    color: '#555',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  metricNotes: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#777',
    fontStyle: 'italic',
  },
});
