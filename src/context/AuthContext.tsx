'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { isSiteAdmin, getUserRole, saveLocalConnectedUser, ROOT_ADMIN_EMAIL } from '@/lib/admin';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatAuthError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/user-disabled':
      return 'Ce compte utilisateur a été désactivé.';
    case 'auth/user-not-found':
      return 'Aucun compte associé à cette adresse email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Identifiants incorrects (email ou mot de passe erroné).';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée par un autre compte.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée avant la fin.';
    case 'auth/cancelled-popup-request':
      return 'Demande de connexion Google annulée.';
    case 'auth/popup-blocked':
      return 'La fenêtre pop-up Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.';
    case 'auth/unauthorized-domain':
      return 'Ce domaine d\'application n\'est pas encore autorisé dans Firebase Auth. Veuillez patienter ou actualiser.';
    case 'auth/operation-not-allowed':
      return 'La méthode de connexion sélectionnée n\'est pas activée.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques instants avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Erreur de connexion réseau. Veuillez vérifier votre connexion.';
    default:
      return 'Une erreur est survenue lors de l\'authentification. Veuillez réessayer.';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Si Firebase Auth n'est pas actif (mode fallback local)
      const savedMockUser = localStorage.getItem('second_brain_mock_user');
      if (savedMockUser) {
        try {
          const parsed = JSON.parse(savedMockUser);
          const adminStatus = isSiteAdmin(parsed.email);
          parsed.isAdmin = adminStatus;
          parsed.role = adminStatus ? 'admin' : 'user';
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const adminStatus = isSiteAdmin(fbUser.email);
        const isRoot = (fbUser.email || '').toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
        const role = isRoot ? 'super_admin' : adminStatus ? 'admin' : 'user';

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur Syntropy',
          photoURL: fbUser.photoURL,
          isAdmin: adminStatus,
          role: adminStatus ? 'admin' : 'user',
        };
        setFirebaseUser(fbUser);
        setUser(profile);

        // Enregistrer la session utilisateur pour l'historique d'administration
        const loginRecord = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: profile.displayName,
          photoURL: fbUser.photoURL,
          lastLoginAt: new Date().toISOString(),
          provider: fbUser.providerData?.[0]?.providerId || 'password',
          role: role as 'super_admin' | 'admin' | 'user',
        };

        saveLocalConnectedUser(loginRecord);

        if (db) {
          try {
            setDoc(doc(db, 'system_users', fbUser.uid), loginRecord, { merge: true }).catch(() => {});
            addDoc(collection(db, 'system_login_history'), {
              ...loginRecord,
              timestamp: new Date().toISOString(),
            }).catch(() => {});
          } catch {}
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const adminStatus = isSiteAdmin(email);
      const mockProfile: UserProfile = {
        uid: 'local-user',
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        isAdmin: adminStatus,
        role: adminStatus ? 'admin' : 'user',
      };
      setUser(mockProfile);
      localStorage.setItem('second_brain_mock_user', JSON.stringify(mockProfile));
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.error('[Auth] Erreur login email :', err);
      const msg = formatAuthError(err.code || '');
      setError(msg);
      throw new Error(msg);
    }
  };

  const signupWithEmail = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const adminStatus = isSiteAdmin(email);
      const mockProfile: UserProfile = {
        uid: 'local-user',
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        isAdmin: adminStatus,
        role: adminStatus ? 'admin' : 'user',
      };
      setUser(mockProfile);
      localStorage.setItem('second_brain_mock_user', JSON.stringify(mockProfile));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        const adminStatus = isSiteAdmin(userCredential.user.email);
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName,
          photoURL: userCredential.user.photoURL,
          isAdmin: adminStatus,
          role: adminStatus ? 'admin' : 'user',
        });
      }
    } catch (err: any) {
      console.error('[Auth] Erreur inscription email :', err);
      const msg = formatAuthError(err.code || '');
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const mockEmail = 'ndebeaupuis@gmail.com';
      const adminStatus = isSiteAdmin(mockEmail);
      const mockProfile: UserProfile = {
        uid: 'google-mock-user',
        email: mockEmail,
        displayName: 'Nathan Debeaupuis',
        photoURL: null,
        isAdmin: adminStatus,
        role: adminStatus ? 'admin' : 'user',
      };
      setUser(mockProfile);
      localStorage.setItem('second_brain_mock_user', JSON.stringify(mockProfile));
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('[Auth] Erreur Google sign-in :', err);
      const msg = formatAuthError(err.code || '');
      setError(msg);
      throw new Error(msg);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const msg = 'Veuillez saisir votre adresse email.';
      setError(msg);
      throw new Error(msg);
    }

    if (!isFirebaseConfigured || !auth) {
      console.info('[Auth] Mode dégradé : simulation d\'envoi d\'email de réinitialisation à', cleanEmail);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      console.error('[Auth] Erreur réinitialisation mot de passe :', err);
      const msg = formatAuthError(err.code || '');
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('second_brain_mock_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
