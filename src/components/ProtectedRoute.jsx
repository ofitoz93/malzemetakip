import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-bold text-indigo-600 uppercase tracking-widest text-xs">
        Oturum Kontrol Ediliyor...
      </div>
    );
  }

  // Oturum yoksa Login'e gönder
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Belirli bir rol gerekiyorsa (Örn: Admin) ve kullanıcının rolü yetmiyorsa
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
