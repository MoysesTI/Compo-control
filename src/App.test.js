import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Mock para Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // Simula usuário deslogado
    return jest.fn(); // retorna uma função de cleanup
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}));

// Mock para Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  getFirestore: jest.fn()
}));

test('renderiza o componente de login quando não autenticado', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  
  // Verifica se o componente de login está sendo renderizado
  const loginElement = screen.getByText(/Sistema de gestão de projetos/i);
  expect(loginElement).toBeInTheDocument();
});