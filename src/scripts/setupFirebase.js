/**
 * This script initializes the Firebase database structure for boards and cards
 * Run with: node setupFirebase.js
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDh_dlDBsoKzzEVlw4zs1dVm2hjBuYZ028",
  authDomain: "sistema-web-68131.firebaseapp.com",
  projectId: "sistema-web-68131",
  storageBucket: "sistema-web-68131.firebasestorage.app",
  messagingSenderId: "324690151643",
  appId: "1:324690151643:web:de3bab4342b052c5baa4fe",
  measurementId: "G-89TM7NX1H8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users for testing
const users = [
  {
    id: "user1",
    name: "Ana Silva",
    email: "ana@example.com",
    role: "admin"
  },
  {
    id: "user2",
    name: "Carlos Santos",
    email: "carlos@example.com",
    role: "user"
  },
  {
    id: "user3",
    name: "Maria Oliveira",
    email: "maria@example.com",
    role: "user"
  },
  {
    id: "user4",
    name: "João Pereira",
    email: "joao@example.com",
    role: "user"
  },
  {
    id: "user5",
    name: "Julia Alves",
    email: "julia@example.com",
    role: "user"
  }
];

// Sample boards
const boards = [
  {
    id: "board1",
    title: "Adesivação",
    description: "Projetos de adesivação para veículos e fachadas",
    color: "#2E78D2", // Azul
    members: ["user1", "user2", "user3", "user4"],
    memberNames: ["Ana Silva", "Carlos Santos", "Maria Oliveira", "João Pereira"],
    favorite: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  },
  {
    id: "board2",
    title: "Impressão",
    description: "Projetos de impressão digital em lona e papel",
    color: "#4CAF50", // Verde
    members: ["user1", "user5"],
    memberNames: ["Ana Silva", "Julia Alves"],
    favorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  }
];

// Sample columns for board1
const board1Columns = [
  {
    id: "col1",
    title: "A Fazer",
    order: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  },
  {
    id: "col2",
    title: "Em Andamento",
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  },
  {
    id: "col3",
    title: "Revisão",
    order: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  },
  {
    id: "col4",
    title: "Concluído",
    order: 3,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  }
];

// Sample cards for board1, column1
const board1Col1Cards = [
  {
    title: "Design de banner promocional",
    description: "Criar banner para campanha de inverno",
    labels: ["Design", "Urgente"],
    members: ["Maria Oliveira", "João Pereira"],
    assignedTo: ["user3", "user4"],
    visibility: "public",
    dueDate: new Date("2023-08-15").toISOString(),
    comments: 3,
    attachments: 2,
    order: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  },
  {
    title: "Orçamento para adesivação",
    description: "Preparar orçamento para cliente XYZ",
    labels: ["Orçamento"],
    members: ["Ana Silva"],
    assignedTo: ["user1"],
    visibility: "private",
    dueDate: new Date("2023-08-18").toISOString(),
    comments: 1,
    attachments: 0,
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  }
];

// Sample cards for board1, column2
const board1Col2Cards = [
  {
    title: "Produção de placas de sinalização",
    description: "Produzir 5 placas para Empresa ABC",
    labels: ["Produção"],
    members: ["Carlos Santos", "Julia Alves"],
    assignedTo: ["user2", "user5"],
    visibility: "public",
    dueDate: new Date("2023-08-20").toISOString(),
    comments: 5,
    attachments: 1,
    order: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user1"
  }
];

// Sample cards for board1, column3
const board1Col3Cards = [
  {
    title: "Revisão de arte para banner",
    description: "Verificar cores e dimensões do banner",
    labels: ["Revisão", "Design"],
    members: ["Maria Oliveira", "Ana Silva"],
    assignedTo: ["user3", "user1"],
    visibility: "public",
    dueDate: new Date("2023-08-12").toISOString(),
    comments: 8,
    attachments: 3,
    order: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user3"
  }
];

// Sample cards for board1, column4
const board1Col4Cards = [
  {
    title: "Criação de logotipo",
    description: "Desenvolver logo para Restaurante Delícia",
    labels: ["Design", "Concluído"],
    members: ["João Pereira"],
    assignedTo: ["user4"],
    visibility: "public",
    dueDate: new Date("2023-08-05").toISOString(),
    comments: 12,
    attachments: 4,
    order: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "user4"
  }
];

async function setupFirebase() {
  try {
    console.log("Starting Firebase setup...");
    
    // Add users
    for (const user of users) {
      const { id, ...userData } = user;
      await setDoc(doc(db, "users", id), {
        ...userData,
        createdAt: serverTimestamp()
      });
      console.log(`Added user: ${user.name}`);
    }
    
    // Add boards
    for (const board of boards) {
      const { id, ...boardData } = board;
      await setDoc(doc(db, "boards", id), boardData);
      console.log(`Added board: ${board.title}`);
    }
    
    // Add columns and cards for board1
    for (const column of board1Columns) {
      const { id, ...columnData } = column;
      await setDoc(doc(db, "boards", "board1", "columns", id), columnData);
      console.log(`Added column: ${column.title}`);
      
      // Add cards to each column
      let cards = [];
      
      if (id === "col1") cards = board1Col1Cards;
      else if (id === "col2") cards = board1Col2Cards;
      else if (id === "col3") cards = board1Col3Cards;
      else if (id === "col4") cards = board1Col4Cards;
      
      for (const card of cards) {
        await addDoc(collection(db, "boards", "board1", "columns", id, "cards"), card);
        console.log(`Added card: ${card.title}`);
      }
    }
    
    console.log("Firebase setup completed successfully!");
  } catch (error) {
    console.error("Error setting up Firebase:", error);
  }
}

setupFirebase();