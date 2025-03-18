import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Hook to fetch a collection with real-time updates
export function useCollection(collectionName, queryConstraints = [], orderByField = null) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    let collectionRef = collection(db, collectionName);
    let queryRef = query(collectionRef, ...queryConstraints);
    
    if (orderByField) {
      queryRef = query(queryRef, orderBy(orderByField));
    }
    
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(results);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints), orderByField]);

  return { documents, loading, error };
}

// Hook to fetch a single document with real-time updates
export function useDocument(collectionName, docId) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setDocument(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setDocument({
            id: doc.id,
            ...doc.data()
          });
        } else {
          setDocument(null);
          setError('Document does not exist');
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching document:`, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [collectionName, docId]);

  return { document, loading, error };
}

// CRUD operations
export const firestoreService = {
  // Add a document to a collection
  addDocument: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },

  // Update a document
  updateDocument: async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Get a document (one-time fetch)
  getDocument: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }
};