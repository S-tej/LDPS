import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VitalsContext } from '../context/VitalsContext';
import { AuthContext } from '../context/AuthContext';

// Note: This is a simplified version. In a real app, you would integrate with a PDF generation library.
export default function ReportsScreen() {
  const { historicalVitals } = useContext(VitalsContext);
  const { userProfile } = useContext(AuthContext);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [reports, setReports] = useState<{id: string, name: string, date: Date, size: string}[]>([]);

  useEffect(() => {
    // In a real app, you would fetch the list of saved reports from storage or the server
    setReports([
      { 
        id: '1', 
        name: 'Monthly Health Report', 
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        size: '1.2 MB' 
      },
      { 
        id: '2', 
        name: 'Weekly Vitals Summary', 
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
        size: '0.8 MB' 
      }
    ]);
  }, []);

  const handleGenerateReport = () => {
    setGenerateLoading(true);
    
    // Simulate report generation delay
    setTimeout(() => {
      setGenerateLoading(false);
      
      // Add a new report to the list
      const newReport = {
        id: (reports.length + 1).toString(),
        name: 'Health Status Report',
        date: new Date(),
        size: '1.5 MB'
      };
      
      setReports([newReport, ...reports]);
      
      Alert.alert(
        'Report Generated',
        'Your health report has been successfully generated.',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleShareReport = (report: any) => {
    Alert.alert(
      'Share Report',
      `Share "${report.name}" with your healthcare provider?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            // In a real app, implement sharing functionality here
            Alert.alert('Report Shared', 'Report has been shared with your healthcare provider.');
          }
        }
      ]
    );
  };

  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setReports(reports.filter(r => r.id !== reportId));
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Health Reports" }} />
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Health Reports</Text>
          <Text style={styles.headerSubtitle}>
            Generate and manage your health reports
          </Text>
          
          <TouchableOpacity 
            style={[styles.generateButton, generateLoading && styles.generateButtonDisabled]}
            onPress={handleGenerateReport}
            disabled={generateLoading}
          >
            {generateLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Reports</Text>
          {reports.length > 0 ? (
            reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportIconContainer}>
                  <Ionicons name="document-text" size={24} color="#5C6BC0" />
                </View>
                
                <View style={styles.reportDetails}>
                  <Text style={styles.reportName}>{report.name}</Text>
                  <Text style={styles.reportMeta}>
                    {report.date.toLocaleDateString()} • {report.size}
                  </Text>
                </View>
                
                <View style={styles.reportActions}>
                  <TouchableOpacity 
                    style={styles.reportActionButton}
                    onPress={() => handleShareReport(report)}
                  >
                    <Ionicons name="share-outline" size={20} color="#5C6BC0" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.reportActionButton}
                    onPress={() => handleDeleteReport(report.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No reports generated yet</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#5C6BC0" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Health reports include vital sign history, trends, and insights. Share these reports with your healthcare provider for better care coordination.
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
  headerCard: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#5C6BC080',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
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
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5C6BC020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportDetails: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#888',
  },
  reportActions: {
    flexDirection: 'row',
  },
  reportActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#5C6BC010',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
