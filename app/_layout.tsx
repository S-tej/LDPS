import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { VitalsProvider } from '../context/VitalsContext';
import { AlertsProvider } from '../context/AlertsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <VitalsProvider>
          <AlertsProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#f05545',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </AlertsProvider>
        </VitalsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}