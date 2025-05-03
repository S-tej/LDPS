import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import AuthGuard from '../components/AuthGuard';

export default function ProfileScreen() {
  const { userProfile } = useContext(AuthContext);

  return (
    <AuthGuard requireAuth={true}>
      <>
        <Stack.Screen options={{ 
          title: "Profile",
          headerRight: () => (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => router.push('/profile-setup')}
            >
              <Ionicons name="pencil-outline" size={22} color="white" />
            </TouchableOpacity>
          )
        }} />

        <ScrollView style={styles.container}>
          <View style={styles.headerCard}>
            <Ionicons name="person-circle" size={80} color="#f05545" />
            <Text style={styles.nameText}>{userProfile?.displayName}</Text>
            <Text style={styles.emailText}>{userProfile?.email}</Text>
            <View style={styles.userTypeBadge}>
              <Ionicons 
                name={userProfile?.isPatient ? "body-outline" : "medkit-outline"} 
                size={16} 
                color="#5C6BC0" 
              />
              <Text style={styles.userTypeText}>
                {userProfile?.isPatient ? "Patient" : "Caretaker"}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/profile-setup')}
            >
              <Ionicons name="create-outline" size={24} color="#333" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={22} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/caretakers')}
            >
              <Ionicons name="people-outline" size={24} color="#333" />
              <Text style={styles.menuItemText}>Manage Caretakers</Text>
              <Ionicons name="chevron-forward" size={22} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
              <Text style={styles.menuItemText}>Settings</Text>
              <Ionicons name="chevron-forward" size={22} color="#ccc" />
            </TouchableOpacity>
            
            <LogoutButton 
              color="#FF5252"
              showText={true}
              style={styles.logoutButton}
              textStyle={styles.logoutText}
              iconSize={24}
            />
          </View>

          <Text style={styles.versionText}>LDPS v1.0.0</Text>
        </ScrollView>
      </>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5C6BC020',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
  },
  userTypeText: {
    marginLeft: 6,
    color: '#5C6BC0',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF525210',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    marginRight: 16,
  },
  versionText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 24,
  },
});
