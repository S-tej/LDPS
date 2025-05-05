import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { testFirebaseConnection } from '../utils/firebaseTest';

export default function UnifiedLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const { login, authError } = useContext(AuthContext);

  // Check Firebase connection on load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testFirebaseConnection();
        setConnectionStatus(connected);
        if (!connected) {
          console.warn("Firebase connection failed");
        }
      } catch (error) {
        console.error("Firebase connection test error:", error);
        setConnectionStatus(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Attempting ${isCaretaker ? 'caretaker' : 'patient'} login with: ${email}`);
      await login(email, password, isCaretaker);
      console.log('Login successful');
      // Routing handled in AuthGuard
    } catch (error: any) {
      console.error('Login error:', error);
      
      // More detailed error message
      let errorMessage = authError || 'Please check your credentials and try again';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check your email.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.message?.includes('caretaker')) {
        errorMessage = 'This account is not registered as a caretaker. Please toggle to Patient mode.';
      } else if (error.message?.includes('patient')) {
        errorMessage = 'This account is not registered as a patient. Please toggle to Caretaker mode.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAccount = () => {
    if (isCaretaker) {
      setEmail('caretaker@test.com');
      setPassword('password123');
    } else {
      setEmail('patient@test.com');
      setPassword('password123');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: "Login" }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, isCaretaker ? styles.caretakerTitle : styles.patientTitle]}>
            {isCaretaker ? 'Caretaker Access' : 'Lonely Death Prevention System'}
          </Text>
          <Text style={styles.subtitle}>
            {isCaretaker ? 'Sign in to monitor your patients' : 'Sign in to monitor your health'}
          </Text>
          
          {connectionStatus === false && (
            <View style={styles.connectionError}>
              <Ionicons name="warning" size={18} color="#f05545" />
              <Text style={styles.connectionErrorText}>Firebase connection failed. Check your internet.</Text>
            </View>
          )}
        </View>

        <View style={styles.userTypeContainer}>
          <Text style={styles.toggleLabel}>Login as:</Text>
          <View style={styles.toggleSwitchContainer}>
            <Text style={[styles.toggleText, !isCaretaker && styles.activeToggleText]}>Patient</Text>
            <Switch
              value={isCaretaker}
              onValueChange={setIsCaretaker}
              trackColor={{ false: '#f05545', true: '#5C6BC0' }}
              thumbColor={'#ffffff'}
              style={styles.toggleSwitch}
            />
            <Text style={[styles.toggleText, isCaretaker && styles.activeToggleText]}>Caretaker</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                testID="password-input"
              />
              <TouchableOpacity 
                style={styles.passwordVisibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={[styles.forgotPasswordText, isCaretaker ? styles.caretakerText : styles.patientText]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              isCaretaker ? styles.caretakerButton : styles.patientButton,
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            testID="login-button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isCaretaker ? 'Sign In as Caretaker' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/register',
                params: { userType: isCaretaker ? 'caretaker' : 'patient' }
              })}
            >
              <Text style={[styles.registerLink, isCaretaker ? styles.caretakerText : styles.patientText]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
          
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.testAccountButton, isCaretaker ? styles.caretakerBorder : styles.patientBorder]} 
              onPress={fillTestAccount}
            >
              <Text style={[styles.testAccountText, isCaretaker ? styles.caretakerText : styles.patientText]}>
                Fill Test {isCaretaker ? 'Caretaker' : 'Patient'} Account
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  patientTitle: {
    color: '#f05545',
  },
  caretakerTitle: {
    color: '#5C6BC0',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  connectionError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeeee',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  connectionErrorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginLeft: 6,
  },
  userTypeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  toggleSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#888',
  },
  activeToggleText: {
    color: '#333',
    fontWeight: 'bold',
  },
  toggleSwitch: {
    transform: [{scaleX: 1.1}, {scaleY: 1.1}]
  },
  formContainer: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  passwordVisibilityButton: {
    padding: 10,
    marginRight: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  patientText: {
    color: '#f05545',
  },
  caretakerText: {
    color: '#5C6BC0',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  patientButton: {
    backgroundColor: '#f05545',
  },
  caretakerButton: {
    backgroundColor: '#5C6BC0', 
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testAccountButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  patientBorder: {
    borderColor: '#f05545',
  },
  caretakerBorder: {
    borderColor: '#5C6BC0',
  },
  testAccountText: {
    fontSize: 14,
  }
});
