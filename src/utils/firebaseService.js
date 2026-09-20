import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  INITIAL_SETS,
  INITIAL_HANJA,
  INITIAL_WORDS,
  saveStudySets,
  saveHanjaItems,
  saveWordItems,
  getStudySets,
  getHanjaItems,
  getWordItems,
} from './storage';

// Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOVeQiNOlYQN5TWnkfKOaoLmbLrz0t0bQ",
  authDomain: "hanja-46e6a.firebaseapp.com",
  projectId: "hanja-46e6a",
  storageBucket: "hanja-46e6a.firebasestorage.app",
  messagingSenderId: "603896728262",
  appId: "1:603896728262:web:a47e518ce9baf4c06be5c7",
  measurementId: "G-6L503JYXYX"
};

// Initialize Firebase App, Firestore and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Collection Names
const SETS_COLLECTION = 'studySets';
const HANJA_COLLECTION = 'hanjaItems';
const WORD_COLLECTION = 'wordItems';

/**
 * Fetch all study data from Firebase Firestore.
 * If Firestore is empty (first run), seeds it with initial default data.
 * Also keeps localStorage updated as an offline fallback cache.
 */
export const fetchStudyDataFromFirebase = async () => {
  try {
    // 1. Fetch study sets
    const setsSnapshot = await getDocs(collection(db, SETS_COLLECTION));
    let sets = setsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    // 2. Fetch hanja items
    const hanjaSnapshot = await getDocs(collection(db, HANJA_COLLECTION));
    let hanja = hanjaSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    // 3. Fetch word items
    const wordSnapshot = await getDocs(collection(db, WORD_COLLECTION));
    let words = wordSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    // If Firestore is completely empty, Seed with INITIAL data!
    if (sets.length === 0) {
      console.log('Firestore is empty. Seeding initial study sets, hanja, and words...');
      await seedInitialDataToFirestore();
      sets = INITIAL_SETS;
      hanja = INITIAL_HANJA;
      words = INITIAL_WORDS;
    }

    // Save to local cache for fast offline resilience
    saveStudySets(sets);
    saveHanjaItems(hanja);
    saveWordItems(words);

    return {
      studySets: sets,
      hanjaItems: hanja,
      wordItems: words,
      source: 'firebase',
    };
  } catch (error) {
    console.warn('Failed to fetch from Firebase, falling back to localStorage cache:', error);
    return {
      studySets: getStudySets(),
      hanjaItems: getHanjaItems(),
      wordItems: getWordItems(),
      source: 'local_fallback',
      error: error.message,
    };
  }
};

/**
 * Seed initial sample datasets to Firestore in batches
 */
export const seedInitialDataToFirestore = async () => {
  try {
    const batch = writeBatch(db);

    INITIAL_SETS.forEach((s) => {
      const ref = doc(db, SETS_COLLECTION, s.id);
      batch.set(ref, s);
    });

    INITIAL_HANJA.forEach((h) => {
      const ref = doc(db, HANJA_COLLECTION, h.id);
      batch.set(ref, h);
    });

    INITIAL_WORDS.forEach((w) => {
      const ref = doc(db, WORD_COLLECTION, w.id);
      batch.set(ref, w);
    });

    await batch.commit();
    console.log('Successfully seeded initial data to Firestore!');
  } catch (err) {
    console.error('Error seeding initial data to Firestore:', err);
  }
};

// --- STUDY SET FIRESTORE OPERATIONS ---
export const saveStudySetToFirestore = async (set) => {
  try {
    await setDoc(doc(db, SETS_COLLECTION, set.id), set);
  } catch (err) {
    console.error('Error saving study set to Firestore:', err);
  }
};

export const deleteStudySetFromFirestore = async (setId, hanjaItems, wordItems) => {
  try {
    // 1. Delete set document
    await deleteDoc(doc(db, SETS_COLLECTION, setId));

    // 2. Delete all child hanja & word items belonging to this set
    const batch = writeBatch(db);
    const relatedHanja = hanjaItems.filter((h) => h.setId === setId);
    const relatedWords = wordItems.filter((w) => w.setId === setId);

    relatedHanja.forEach((h) => {
      batch.delete(doc(db, HANJA_COLLECTION, h.id));
    });
    relatedWords.forEach((w) => {
      batch.delete(doc(db, WORD_COLLECTION, w.id));
    });

    await batch.commit();
  } catch (err) {
    console.error('Error deleting study set from Firestore:', err);
  }
};

// --- HANJA FIRESTORE OPERATIONS ---
export const saveHanjaItemsToFirestore = async (newItems) => {
  try {
    const batch = writeBatch(db);
    newItems.forEach((item) => {
      batch.set(doc(db, HANJA_COLLECTION, item.id), item);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving hanja items to Firestore:', err);
  }
};

export const updateHanjaItemInFirestore = async (item) => {
  try {
    await setDoc(doc(db, HANJA_COLLECTION, item.id), item);
  } catch (err) {
    console.error('Error updating hanja item in Firestore:', err);
  }
};

export const deleteHanjaItemFromFirestore = async (itemId) => {
  try {
    await deleteDoc(doc(db, HANJA_COLLECTION, itemId));
  } catch (err) {
    console.error('Error deleting hanja item from Firestore:', err);
  }
};

// --- WORD FIRESTORE OPERATIONS ---
export const saveWordItemsToFirestore = async (newItems) => {
  try {
    const batch = writeBatch(db);
    newItems.forEach((item) => {
      batch.set(doc(db, WORD_COLLECTION, item.id), item);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving word items to Firestore:', err);
  }
};

export const updateWordItemInFirestore = async (item) => {
  try {
    await setDoc(doc(db, WORD_COLLECTION, item.id), item);
  } catch (err) {
    console.error('Error updating word item in Firestore:', err);
  }
};

export const deleteWordItemFromFirestore = async (itemId) => {
  try {
    await deleteDoc(doc(db, WORD_COLLECTION, itemId));
  } catch (err) {
    console.error('Error deleting word item from Firestore:', err);
  }
};

// --- AUTHENTICATION HELPERS ---
export const loginAdminWithFirebase = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutAdminFromFirebase = async () => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
