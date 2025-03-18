// src/components/layout/PermissionRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PermissionRoute({ children, resource }) {
  const { currentUser, hasPermission } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!hasPermission(resource)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}