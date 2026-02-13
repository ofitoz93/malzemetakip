import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PersonnelDashboard from './pages/PersonnelDashboard';
import GuestHome from './pages/GuestHome';
import ScannerPage from './pages/ScannerPage';
import EquipmentDetail from './pages/EquipmentDetail';
import WorkerControlForm from './pages/WorkerControlForm';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Routes>
          {/* 1. Giriş Ekranı (İlk Karşılama) */}
          <Route path="/" element={<Login />} />

          {/* 2. Üyeliksiz Kullanıcı / İşçi Alanı */}
          <Route path="/home" element={<GuestHome />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/equipment/:qrId" element={<EquipmentDetail />} />
          <Route path="/worker-control/:qrId" element={<WorkerControlForm />} />

          {/* 3. Yetkili Personel Alanları */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel"
            element={
              <ProtectedRoute requiredRole="inspector">
                <PersonnelDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
