import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [authError]);

  // Map Firebase error codes to user-friendly messages
  const getErrorMessage = (error) => {
    console.error('Auth error:', error);
    
    const errorMap = {
      'auth/email-already-in-use': 'Este email já está sendo utilizado.',
      'auth/invalid-email': 'Endereço de email inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas de login. Tente novamente mais tarde.',
      'auth/invalid-credential': 'Credenciais inválidas.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/popup-closed-by-user': 'Login cancelado pelo usuário.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/requires-recent-login': 'Por favor, faça login novamente para completar esta ação.',
    };
    
    return errorMap[error.code] || error.message;
  };

  async function signup(email, password, name) {
    try {
      setAuthError(null);
      console.log(`Creating new user account: ${email}`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Create user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      console.log(`User account created successfully: ${email}`);
      return userCredential;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Signup failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }

  async function login(email, password) {
    try {
      setAuthError(null);
      console.log(`Attempting login: ${email}`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp
      const userRef = doc(db, "users", userCredential.user.uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      console.log(`User logged in successfully: ${email}`);
      return userCredential;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Login failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }

  async function logout() {
    try {
      setAuthError(null);
      console.log('User logging out');
      
      await signOut(auth);
      
      console.log('User logged out successfully');
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Logout failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }
  
  async function resetPassword(email) {
    try {
      setAuthError(null);
      console.log(`Sending password reset email to: ${email}`);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log(`Password reset email sent to: ${email}`);
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Password reset failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }
  
  async function updateUserEmail(newEmail) {
    try {
      setAuthError(null);
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log(`Updating email for user ${currentUser.uid}: ${newEmail}`);
      
      await updateEmail(currentUser, newEmail);
      
      // Update email in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Email updated successfully to: ${newEmail}`);
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Email update failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }
  
  async function updateUserPassword(newPassword) {
    try {
      setAuthError(null);
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log(`Updating password for user: ${currentUser.uid}`);
      
      await updatePassword(currentUser, newPassword);
      
      // Update password change timestamp in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        passwordUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Password updated successfully');
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Password update failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }
  
  async function updateUserProfile(userData) {
    try {
      setAuthError(null);
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log(`Updating profile for user: ${currentUser.uid}`);
      
      // Update displayName if provided
      if (userData.name) {
        await updateProfile(currentUser, {
          displayName: userData.name
        });
      }
      
      // Update user data in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
      
      // Update local userProfile state
      const updatedProfile = { ...userProfile, ...userData };
      setUserProfile(updatedProfile);
      
      console.log('Profile updated successfully');
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Profile update failed: ${message}`);
      setAuthError(message);
      throw new Error(message);
    }
  }

  async function fetchUserProfile(user) {
    if (!user) return null;
    
    try {
      console.log(`Fetching profile for user: ${user.uid}`);
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log(`Profile found for user: ${user.uid}`);
        return { id: user.uid, ...userSnap.data() };
      }
      
      // If user doesn't have a profile yet, create one
      console.log(`Creating new profile for user: ${user.uid}`);
      
      const newUserData = {
        name: user.displayName || 'Usuário',
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(userRef, newUserData);
      
      console.log(`New profile created for user: ${user.uid}`);
      return { id: user.uid, ...newUserData };
    } catch (error) {
      console.error(`Error fetching user profile: ${error.message}`);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log(`Auth state changed. User: ${user ? user.email : 'None'}`);
        
        if (user) {
          const profile = await fetchUserProfile(user);
          setCurrentUser(user);
          setUserProfile(profile);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error(`Auth state change error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    authError,
    signup,
    login,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    updateUserProfile,
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}