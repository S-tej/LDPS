import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { 
  findCaretakerByPhone, 
  linkPatientToCaretaker, 
  unlinkPatientFromCaretaker, 
  getPatientCaretakers,
  Caretaker
} from '../services/caretakerService';
import LogoutButton from '../components/LogoutButton';

type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isCaretaker: boolean;
  uid?: string; // For actual caretakers from the system
};

export default function CaretakersScreen() {
  const { userProfile, updateUserProfile } = useContext(AuthContext);
  
  // Convert emergency contacts from profile to our local format
  const initialContacts: Contact[] = userProfile?.emergencyContacts 
    ? userProfile.emergencyContacts.map((contact, index) => ({
        id: index.toString(),
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phoneNumber,
        isCaretaker: contact.isCaretaker,
      }))
    : [];
  
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>({
    name: '',
    relationship: '',
    phone: '',
    isCaretaker: true,
  });

  // State for caretaker search
  const [searchCaretakerPhone, setSearchCaretakerPhone] = useState('');
  const [searchingCaretaker, setSearchingCaretaker] = useState(false);
  const [foundCaretaker, setFoundCaretaker] = useState<{uid: string, name: string} | null>(null);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCaretakers();
  }, [userProfile?.uid]);

  const loadCaretakers = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      const caretakersList = await getPatientCaretakers(userProfile.uid);
      setCaretakers(caretakersList);
    } catch (error) {
      console.error('Error loading caretakers:', error);
      Alert.alert('Error', 'Failed to load caretakers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    const contact = {
      id: Date.now().toString(),
      ...newContact
    };

    const updatedContacts = [...contacts, contact];
    setContacts(updatedContacts);

    // Update user profile in Firebase
    const emergencyContacts = updatedContacts.map(c => ({
      name: c.name,
      relationship: c.relationship,
      phoneNumber: c.phone,
      isCaretaker: c.isCaretaker,
    }));

    updateUserProfile({ emergencyContacts })
      .catch(error => {
        Alert.alert('Error', 'Failed to update contacts');
        console.error('Update error:', error);
      });

    // Reset form
    setNewContact({
      name: '',
      relationship: '',
      phone: '',
      isCaretaker: true,
    });
    setShowAddForm(false);
  };

  const handleSearchCaretaker = async () => {
    if (!searchCaretakerPhone) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    try {
      setSearchingCaretaker(true);
      const caretaker = await findCaretakerByPhone(searchCaretakerPhone);
      
      if (caretaker) {
        setFoundCaretaker({
          uid: caretaker.uid,
          name: caretaker.displayName
        });
      } else {
        Alert.alert('Not Found', 'No caretaker found with this phone number');
        setFoundCaretaker(null);
      }
    } catch (error) {
      console.error('Error searching caretaker:', error);
      Alert.alert('Error', 'Failed to search for caretaker');
    } finally {
      setSearchingCaretaker(false);
    }
  };

  const addCaretaker = async () => {
    if (!foundCaretaker || !userProfile?.uid) return;
    
    try {
      // Check if caretaker is already added
      const isAlreadyAdded = caretakers.some(c => c.uid === foundCaretaker.uid);
      
      if (isAlreadyAdded) {
        Alert.alert('Already Added', 'This caretaker is already linked to your account');
        return;
      }
      
      // Link the patient to the caretaker
      await linkPatientToCaretaker(userProfile.uid, foundCaretaker.uid);
      
      // Reset form and reload caretakers
      setSearchCaretakerPhone('');
      setFoundCaretaker(null);
      loadCaretakers();
      
      Alert.alert('Success', 'Caretaker added successfully');
    } catch (error) {
      console.error('Error adding caretaker:', error);
      Alert.alert('Error', 'Failed to add caretaker');
    }
  };

  const removeCaretaker = async (caretakerId: string) => {
    if (!userProfile?.uid) return;
    
    try {
      // Unlink the patient from the caretaker
      await unlinkPatientFromCaretaker(userProfile.uid, caretakerId);
      
      // Update local state
      setCaretakers(caretakers.filter(c => c.uid !== caretakerId));
      
      Alert.alert('Success', 'Caretaker removed successfully');
    } catch (error) {
      console.error('Error removing caretaker:', error);
      Alert.alert('Error', 'Failed to remove caretaker');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Caretakers & Emergency Contacts",
          headerRight: () => <LogoutButton color="white" />
        }} 
      />
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          Add people who should be notified in case of emergency. Contacts marked as caretakers will receive regular health updates.
        </Text>
        
        {/* System Caretakers Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Health App Caretakers</Text>
          <Text style={styles.sectionDescription}>
            Add registered caretakers by their phone number to share your health data securely.
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchCaretakerPhone}
              onChangeText={setSearchCaretakerPhone}
              placeholder="Enter caretaker's phone number"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchCaretaker}
              disabled={searchingCaretaker}
            >
              {searchingCaretaker ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {foundCaretaker && (
            <View style={styles.foundCaretakerContainer}>
              <View style={styles.foundCaretakerInfo}>
                <Text style={styles.foundCaretakerName}>{foundCaretaker.name}</Text>
                <Text style={styles.foundCaretakerPhone}>Phone: {searchCaretakerPhone}</Text>
              </View>
              <TouchableOpacity
                style={styles.addCaretakerButton}
                onPress={addCaretaker}
              >
                <Text style={styles.addCaretakerButtonText}>Add as Caretaker</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} size="large" color="#5C6BC0" />
          ) : caretakers.length > 0 ? (
            <View style={styles.caretakersList}>
              {caretakers.map((caretaker) => (
                <View key={caretaker.uid} style={styles.caretakerCard}>
                  <View style={styles.caretakerInfo}>
                    <Text style={styles.caretakerName}>{caretaker.displayName}</Text>
                    <Text style={styles.caretakerPhone}>{caretaker.phoneNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeCaretakerButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Caretaker',
                        'Are you sure you want to remove this caretaker? They will no longer have access to your health data.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Remove', 
                            style: 'destructive',
                            onPress: () => removeCaretaker(caretaker.uid)
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noCaretakersText}>
              No caretakers added yet. Search by phone number to add a caretaker.
            </Text>
          )}
        </View>
        
        {/* Regular Emergency Contacts Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          {!showAddForm ? (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.addButtonText}>Add New Contact</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add Emergency Contact</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({...newContact, name: text})}
                  placeholder="Contact name"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.relationship}
                  onChangeText={(text) => setNewContact({...newContact, relationship: text})}
                  placeholder="e.g. Family, Friend, Doctor"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact({...newContact, phone: text})}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Is Caretaker</Text>
                <Switch
                  value={newContact.isCaretaker}
                  onValueChange={(value) => setNewContact({...newContact, isCaretaker: value})}
                  trackColor={{ false: '#cccccc', true: '#5C6BC080' }}
                  thumbColor={newContact.isCaretaker ? '#5C6BC0' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddContact}
                >
                  <Text style={styles.saveButtonText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactDetails}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.isCaretaker && (
                      <View style={styles.caretakerBadge}>
                        <Text style={styles.caretakerBadgeText}>Caretaker</Text>
                      </View>
                    )}
                  </View>
                  
                  {contact.relationship && (
                    <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                  )}
                  
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.contactActionButton}
                    onPress={() => {
                      // To be implemented: Edit contact
                    }}
                  >
                    <Ionicons name="create-outline" size={22} color="#5C6BC0" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.contactActionButton}
                    onPress={() => {
                      const updatedContacts = contacts.filter(c => c.id !== contact.id);
                      setContacts(updatedContacts);
                      
                      // Update profile
                      const emergencyContacts = updatedContacts.map(c => ({
                        name: c.name,
                        relationship: c.relationship,
                        phoneNumber: c.phone,
                        isCaretaker: c.isCaretaker,
                      }));
                      
                      updateUserProfile({ emergencyContacts })
                        .catch(error => {
                          Alert.alert('Error', 'Failed to update contacts');
                          console.error('Update error:', error);
                        });
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No emergency contacts added yet</Text>
            </View>
          )}
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
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#5C6BC0',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  contactDetails: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  caretakerBadge: {
    backgroundColor: '#5C6BC020',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  caretakerBadgeText: {
    color: '#5C6BC0',
    fontSize: 12,
  },
  contactRelationship: {
    color: '#666',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#666',
  },
  contactActions: {
    justifyContent: 'center',
  },
  contactActionButton: {
    padding: 8,
    marginBottom: 4,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  foundCaretakerContainer: {
    borderWidth: 1,
    borderColor: '#5C6BC0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#5C6BC020',
  },
  foundCaretakerInfo: {
    marginBottom: 8,
  },
  foundCaretakerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  foundCaretakerPhone: {
    fontSize: 14,
    color: '#666',
  },
  addCaretakerButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addCaretakerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingIndicator: {
    padding: 20,
  },
  caretakersList: {
    marginTop: 8,
  },
  caretakerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  caretakerInfo: {
    flex: 1,
  },
  caretakerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  caretakerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeCaretakerButton: {
    padding: 4,
  },
  noCaretakersText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

