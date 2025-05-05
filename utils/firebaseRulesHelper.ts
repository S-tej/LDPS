/**
 * Firebase Realtime Database Rules Helper
 * 
 * To fix permission issues, copy these rules to your Firebase Console:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project
 * 3. Go to Realtime Database
 * 4. Click on "Rules" tab
 * 5. Replace the existing rules with the rules below
 * 6. Click "Publish"
 */

export const databaseRules = `
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "users": {
      ".read": true,
      ".write": true,
      ".indexOn": ["email"]
    },
    
    "profiles": {
      "$userId": {
        ".read": true,
        ".write": true
      }
    },
    
    "vitals": {
      "$userId": {
        ".read": true,
        ".write": true
      }
    },
    
    "alerts": {
      "$userId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["timestamp"]
      }
    },
    
    "notifications": {
      "caretakers": {
        "$patientId": {
          ".read": true,
          ".write": true
        }
      }
    },
    
    "passwordResets": {
      ".read": true,
      ".write": true
    },
    
    "devices": {
      ".read": true,
      ".write": true
    },
    
    "ecg_data": {
      "$deviceId": {
        ".read": true,
        ".write": true
      }
    },
    
    "test": {
      ".read": true,
      ".write": true
    },
    
    "connection_test": {
      ".read": true,
      ".write": true
    }
  }
}
`;

/**
 * Instructions to apply these rules:
 * 
 * 1. Copy the rules above
 * 2. Go to your Firebase Console
 * 3. Navigate to Realtime Database > Rules
 * 4. Paste and publish these rules
 * 
 * These rules allow full access to all paths that your app uses.
 * In a production environment, you'd want more restrictive rules.
 */
