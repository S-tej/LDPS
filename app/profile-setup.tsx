import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileSetupScreen() {
  const { userProfile, updateUserProfile } = useContext(AuthContext);
  
  // Redirect caretakers to their dashboard
  useEffect(() => {
    if (userProfile?.userType === 'caretaker') {
      router.replace('/caretaker/dashboard');
    }
  }, [userProfile]);
  
  const [age, setAge] = useState(userProfile?.age?.toString() || '');
  const [gender, setGender] = useState(userProfile?.gender || '');
  const [medicalConditions, setMedicalConditions] = useState<string[]>(userProfile?.medicalConditions || []);
  const [newCondition, setNewCondition] = useState('');
  const [medications, setMedications] = useState<string[]>(userProfile?.medications || []);
  const [newMedication, setNewMedication] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCondition = () => {
    if (newCondition.trim().length > 0) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = [...medicalConditions];
    updatedConditions.splice(index, 1);
    setMedicalConditions(updatedConditions);
  };

  const handleAddMedication = () => {
    if (newMedication.trim().length > 0) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };

  const handleSaveProfile = async () => {
    if (!age || !gender) {
      Alert.alert('Error', 'Please fill in age and gender');
      return;
    }

    try {
      setIsLoading(true);
      await updateUserProfile({
        age: parseInt(age),
        gender,
        medicalConditions,
        medications,
      });
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [{ text: 'OK', onPress: () => router.push('/dashboard') }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Complete Your Profile" }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'Male' && styles.genderButtonActive
                ]}
                onPress={() => setGender('Male')}
              >
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={gender === 'Male' ? 'white' : '#5C6BC0'} 
                />
                <Text style={[
                  styles.genderText,
                  gender === 'Male' && styles.genderTextActive
                ]}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'Female' && styles.genderButtonActive
                ]}
                onPress={() => setGender('Female')}
              >
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={gender === 'Female' ? 'white' : '#E91E63'} 
                />
                <Text style={[
                  styles.genderText,
                  gender === 'Female' && styles.genderTextActive
                ]}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'Other' && styles.genderButtonActive
                ]}
                onPress={() => setGender('Other')}
              >
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={gender === 'Other' ? 'white' : '#9C27B0'} 
                />
                <Text style={[
                  styles.genderText,
                  gender === 'Other' && styles.genderTextActive
                ]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medical Conditions</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newCondition}
                onChangeText={setNewCondition}
                placeholder="Enter condition"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddCondition}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {medicalConditions.map((condition, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{condition}</Text>
                  <TouchableOpacity onPress={() => handleRemoveCondition(index)}>
                    <Ionicons name="close-circle" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medications</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newMedication}
                onChangeText={setNewMedication}
                placeholder="Enter medication"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMedication}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {medications.map((medication, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{medication}</Text>
                  <TouchableOpacity onPress={() => handleRemoveMedication(index)}>
                    <Ionicons name="close-circle" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
          
          {!userProfile?.age && (
            <TouchableOpacity 
              onPress={() => router.push('/dashboard')}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 16,
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
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    width: '31%',
  },
  genderButtonActive: {
    backgroundColor: '#f05545',
    borderColor: '#f05545',
  },
  genderText: {
    marginLeft: 8,
    color: '#333',
  },
  genderTextActive: {
    color: 'white',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#5C6BC0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: 'white',
    marginRight: 6,
  },
  saveButton: {
    backgroundColor: '#f05545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#f0554580',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    padding: 15,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});