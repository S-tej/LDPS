import React, { useContext, useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

type LogoutButtonProps = {
  color?: string;
  showText?: boolean;
  style?: object;
  textStyle?: object;
  iconSize?: number;
  confirmLogout?: boolean;
};

export default function LogoutButton({
  color = 'white',
  showText = false,
  style = {},
  textStyle = {},
  iconSize = 24,
  confirmLogout = true
}: LogoutButtonProps) {
  const { logout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        await logout();
        // Router will handle redirection in AuthContext
      } catch (error) {
        Alert.alert(
          'Logout Failed',
          'There was a problem logging out. Please try again.',
          [{ text: 'OK' }]
        );
        console.error('Logout error:', error);
        setIsLoggingOut(false);
      }
    };

    if (confirmLogout) {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performLogout }
        ]
      );
    } else {
      await performLogout();
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={[styles.button, style]}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <Ionicons name="log-out-outline" size={iconSize} color={color} />
          {showText && (
            <Text style={[styles.text, { color }, textStyle]}>
              Logout
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  }
});
