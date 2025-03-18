import React, { createContext, useContext, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, fetchSignInMethodsForEmail } from 'firebase/auth';

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

 // No AuthContext.js

 async function signup(email, password, name, role = 'funcionario') {
  try {
    // Verificar se o email já existe
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods && methods.length > 0) {
      throw new Error('Este email já está sendo usado por outra conta.');
    }
    
    // Criar o usuário
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Criar perfil de usuário no Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      role,
      createdAt: new Date(),
    });
    
    return userCredential;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está sendo usado por outra conta.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O email fornecido é inválido.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }
    throw error;
  }
}
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function fetchUserProfile(user) {
    if (!user) return null;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: user.uid, ...userSnap.data() };
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
    
    return null;
  }

  // Função para verificar se o usuário é administrador
  function isAdmin() {
    return userProfile?.role === 'administrador';
  }

  // Função para verificar se o usuário tem permissão para acessar um recurso
  function hasPermission(resource) {
    if (isAdmin()) return true; // Administrador tem acesso a tudo
    
    // Permissões para funcionários
    const funcionarioPermissions = [
      'boards', 
      'team', 
      'profile', 
      'recentProjects'
    ];
    
    return funcionarioPermissions.includes(resource);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const profile = await fetchUserProfile(user);
          setCurrentUser(user);
          setUserProfile(profile);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    isAdmin,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}