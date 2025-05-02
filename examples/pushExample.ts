import { database } from '../firebase/config';
import { ref, push } from 'firebase/database';

// Adding a new vital sign reading - Firebase generates the pushId
const historyRef = ref(database, `vitals/${userId}/history`);
const newReadingRef = push(historyRef);  // This creates a reference with a new unique pushId

// You can access the generated key
const pushId = newReadingRef.key;
console.log("Generated pushId:", pushId);  // e.g. "-NjH7y5cXmTuAapmZ9q2"

// Then set the data at this reference
set(newReadingRef, vitalData);
