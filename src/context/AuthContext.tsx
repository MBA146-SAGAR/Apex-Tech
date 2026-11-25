import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';
import { UserRole } from '../types/apex';

export interface AuthUserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

interface AuthResult {
  ok: boolean;
  error?: string;
  message?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: AuthUserProfile | null;
  authLoading: boolean;
  isAuthenticatedAndVerified: boolean;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  resendVerificationEmail: () => Promise<AuthResult>;
  refreshVerificationStatus: () => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an administrator.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network error while connecting to authentication service. Please check your connection.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const syncUserProfileFromFirestore = async (user: User) => {
    const path = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      const isBootstrapAdmin =
        user.emailVerified && user.email?.toLowerCase() === 'sagargirdher22@gmail.com';

      if (snap.exists()) {
        const data = snap.data() as AuthUserProfile;
        // Sync verified status if user just verified their email link
        if (user.emailVerified && (!data.emailVerified || (isBootstrapAdmin && data.role !== 'ADMIN'))) {
          const nextRole: UserRole = isBootstrapAdmin ? 'ADMIN' : data.role;
          await updateDoc(userRef, {
            emailVerified: true,
            ...(isBootstrapAdmin && data.role !== 'ADMIN' ? { role: 'ADMIN' } : {}),
            updatedAt: serverTimestamp(),
          });
          setUserProfile({ ...data, emailVerified: true, role: nextRole });
        } else {
          setUserProfile(data);
        }
      } else {
        const defaultName =
          user.displayName && user.displayName.trim().length >= 2
            ? user.displayName.trim().slice(0, 100)
            : (user.email?.split('@')[0] || 'Apex User').slice(0, 100);
        const role: UserRole = isBootstrapAdmin ? 'ADMIN' : 'EXECUTIVE';
        const profilePayload = {
          uid: user.uid,
          fullName: defaultName,
          email: user.email || '',
          role,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, profilePayload);
        setUserProfile({
          uid: user.uid,
          fullName: defaultName,
          email: user.email || '',
          role,
          emailVerified: user.emailVerified,
        });
      }
    } catch (error) {
      // Do not crash login gate if Firestore rules reject before email verification;
      // surface real Firestore errors for diagnostics if verified.
      if (user.emailVerified) {
        handleFirestoreError(error, OperationType.WRITE, path);
      } else {
        setUserProfile({
          uid: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'EXECUTIVE',
          emailVerified: false,
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncUserProfileFromFirestore(user);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const registerWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return { ok: false, error: 'Full name must be between 2 and 100 characters.' };
    }
    if (cleanEmail.length < 5 || cleanEmail.length > 160) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanName });

      const userRef = doc(db, 'users', cred.user.uid);
      try {
        await setDoc(userRef, {
          uid: cred.user.uid,
          fullName: cleanName,
          email: cred.user.email || cleanEmail,
          role: 'EXECUTIVE',
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.CREATE, `users/${cred.user.uid}`);
      }

      await sendEmailVerification(cred.user, {
        url: window.location.origin,
      });

      setFirebaseUser(cred.user);
      setUserProfile({
        uid: cred.user.uid,
        fullName: cleanName,
        email: cred.user.email || cleanEmail,
        role: 'EXECUTIVE',
        emailVerified: false,
      });

      return {
        ok: true,
        message: `Account created! A verification link has been sent to ${cred.user.email || cleanEmail}.`,
      };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await cred.user.reload();
      setFirebaseUser(auth.currentUser);
      if (auth.currentUser) {
        await syncUserProfileFromFirestore(auth.currentUser);
      }
      if (!cred.user.emailVerified) {
        return {
          ok: true,
          message: 'Please verify your email address before accessing the platform.',
        };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const resendVerificationEmail = async (): Promise<AuthResult> => {
    if (!auth.currentUser) {
      return { ok: false, error: 'No active session found. Please log in again.' };
    }
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin,
      });
      return {
        ok: true,
        message: `Verification email resent to ${auth.currentUser.email}. Check your inbox and spam folder.`,
      };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const refreshVerificationStatus = async (): Promise<AuthResult> => {
    if (!auth.currentUser) {
      return { ok: false, error: 'No active session found. Please log in again.' };
    }
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      // Force ID token refresh so Firestore security rules see updated email_verified claim
      await updatedUser.getIdToken(true);
      setFirebaseUser(updatedUser);

      if (updatedUser.emailVerified) {
        await syncUserProfileFromFirestore(updatedUser);
        return { ok: true, message: 'Email verified successfully. Redirecting to dashboard...' };
      }
      return {
        ok: false,
        error: 'Email is not verified yet. Please click the verification link sent to your inbox first.',
      };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const sendPasswordReset = async (email: string): Promise<AuthResult> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { ok: false, error: 'Please enter your registered email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: window.location.origin,
      });
      return {
        ok: true,
        message: `Password reset instructions sent to ${cleanEmail}. Check your inbox.`,
      };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authLoading,
        isAuthenticatedAndVerified: Boolean(firebaseUser && firebaseUser.emailVerified),
        registerWithEmail,
        loginWithEmail,
        resendVerificationEmail,
        refreshVerificationStatus,
        sendPasswordReset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
