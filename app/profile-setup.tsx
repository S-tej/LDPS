import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useContext(AuthContext);

  // State for user profile information
  const [age, setAge] = useState<string>(userProfile?.age?.toString() || '');
  const [gender, setGender] = useState<string>(userProfile?.gender || '');
  
  const [medicalCondition, setMedicalCondition] = useState<string>('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    userProfile?.medicalConditions || []
  );
  
  const [medication, setMedication] = useState<string>('');
  const [medications, setMedications] = useState<string[]>(
    userProfile?.medications || []
  );
  
  const [loading, setLoading] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(
    !userProfile?.age && !userProfile?.gender && 
    (!userProfile?.medicalConditions || userProfile.medicalConditions.length === 0) &&
    (!userProfile?.medications || userProfile.medications.length === 0)
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const handleAddMedicalCondition = () => {
    if (medicalCondition.trim()) {
      setMedicalConditions([...medicalConditions, medicalCondition.trim()]);
      setMedicalCondition('');
    }
  };

  const handleRemoveMedicalCondition = (index: number) => {
    const updatedConditions = [...medicalConditions];
    updatedConditions.splice(index, 1);
    setMedicalConditions(updatedConditions);
  };

  const handleAddMedication = () => {
    if (medication.trim()) {
      setMedications([...medications, medication.trim()]);
      setMedication('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };

  const handleSave = async () => {
    if (!age || !gender) {
      Alert.alert('Missing Information', 'Please provide your age and gender.');
      return;
    }

    try {
      setLoading(true);
      
      // Update the user profile in Firebase
      await updateUserProfile({
        age: parseInt(age),
        gender,
        medicalConditions,
        medications
      });
      
      // Alert success and navigate to dashboard or next screen
      if (isNewUser) {
        Alert.alert(
          'Profile Setup Complete', 
          'Your profile has been set up successfully. You can now add emergency contacts.',
          [{ text: 'Continue', onPress: () => router.push('/caretakers') }]
        );
      } else {
        Alert.alert(
          'Profile Updated', 
          'Your profile has been updated successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: isNewUser ? "Profile Setup" : "Edit Profile",
          headerLeft: isNewUser ? undefined : () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container}>
          {isNewUser && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>
                Welcome to Health Guardian System
              </Text>
              <Text style={styles.welcomeText}>
                Please complete your profile information to help us provide better healthcare monitoring.
              </Text>
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
                <Picker.Item label="Prefer not to say" value="not_specified" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter medical condition"
                value={medicalCondition}
                onChangeText={setMedicalCondition}
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMedicalCondition}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {medicalConditions.length > 0 ? (
              <View style={styles.itemsList}>
                {medicalConditions.map((condition, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemText}>{condition}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveMedicalCondition(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#f05545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No medical conditions added</Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medications</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter medication"
                value={medication}
                onChangeText={setMedication}
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMedication}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {medications.length > 0 ? (
              <View style={styles.itemsList}>
                {medications.map((med, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemText}>{med}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveMedication(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#f05545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No medications added</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isNewUser ? 'Continue' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  welcomeContainer: {
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
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: '#f05545',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
