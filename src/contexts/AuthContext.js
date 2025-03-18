import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Criar perfil de usuário no Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      role: 'user',
      createdAt: new Date(),
    });
    
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function fetchUserProfile(user) {
    if (!user) return null;
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: user.uid, ...userSnap.data() };
    }
    
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchUserProfile(user);
        setCurrentUser(user);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}