// src/models/TaskModel.js

import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const TaskStatus = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  REVIEW: 'Revisão',
  DONE: 'Concluído'
};

export const createTask = async (taskData) => {
  try {
    const taskWithTimestamps = {
      ...taskData,
      attachments: taskData.attachments || 0,
      comments: taskData.comments || 0,
      progress: taskData.progress || 0,
      status: taskData.status || TaskStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'tasks'), taskWithTimestamps);
    return { id: docRef.id, ...taskWithTimestamps };
  } catch (error) {
    console.error('Erro ao criar task:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updatedData) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    const dataWithTimestamp = {
      ...updatedData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(taskRef, dataWithTimestamp);
    return { id: taskId, ...updatedData };
  } catch (error) {
    console.error('Erro ao atualizar task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir task:', error);
    throw error;
  }
};

// Função para converter uma task para um card (quando necessário)
export const taskToCard = (task, columnId = 'col-1') => {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
    status: task.status || TaskStatus.PENDING,
    progress: task.progress || 0,
    labels: [],
    boardId: task.boardId,
    columnId: columnId,
    members: task.assignedTo ? (Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]) : [],
    createdBy: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    client: task.client || '',
    comments: task.comments || 0,
    attachments: task.attachments || 0
  };
};

// Função para converter um card para uma task (quando necessário)
export const cardToTask = (card) => {
  return {
    id: card.id,
    title: card.title,
    description: card.description || '',
    dueDate: card.dueDate || '',
    status: card.status || TaskStatus.PENDING,
    progress: card.progress || 0,
    assignedTo: card.members || [],
    boardId: card.boardId,
    userId: card.createdBy,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    client: card.client || '',
    comments: card.comments || 0,
    attachments: card.attachments || 0
  };
};