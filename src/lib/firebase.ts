import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCoqDWp3W5f2eniNQ-aoYSVQKxTQXCGrCg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'second-brain-os-e6a83.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'second-brain-os-e6a83',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'second-brain-os-e6a83.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '778839596253',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:778839596253:web:adc36337485f72d33d8f34',
};

// Vérifie si la configuration Firebase minimale requise est présente et non vide
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 5 &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim().length > 0 &&
  !firebaseConfig.apiKey.includes('VOTRE_')
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    if (typeof window !== 'undefined') {
      console.log('✅ [Firebase] Connecté avec succès au projet :', firebaseConfig.projectId);
    }
  } catch (error) {
    console.warn('⚠️ [Firebase] Échec de l\'initialisation, bascule en mode dégradé :', error);
    db = null;
    auth = null;
  }
} else {
  if (typeof window !== 'undefined') {
    console.info('ℹ️ [Firebase] Aucune clé API configurée. Syntropy fonctionne en mode dégradé (Mock / LocalStorage).');
  }
}

export { app, db, auth, googleProvider };
