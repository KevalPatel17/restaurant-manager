import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const authData = localStorage.getItem('musafir_admin_auth');

  let isAuthenticated = false;
  try {
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed && (parsed.token || parsed.email)) {
        isAuthenticated = true;
      }
    }
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
