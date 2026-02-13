import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// Sayfalar
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PersonnelDashboard from './pages/PersonnelDashboard';
import GuestHome from './pages/GuestHome';
import ScannerPage from './pages/ScannerPage';
import EquipmentDetail from './pages/EquipmentDetail';
import WorkerControlForm from './pages/WorkerControlForm';
import Notifications from './pages/Notifications';
import LocationHistory from './pages/LocationHistory'; // Yeni eklediğimiz iz takibi sayfası

// Yetki Kontrol Bileşeni
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Routes>
          {/* 1. Herkese Açık Sayfalar (Giriş ve Saha İşlemleri) */}
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<GuestHome />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/equipment/:qrId" element={<EquipmentDetail />} />
          <Route path="/worker-control/:qrId" element={<WorkerControlForm />} />

          {/* 2. Yönetici Sayfaları (Sadece Admin Erişebilir) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute requiredRole="admin">
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:qrId"
            element={
              <ProtectedRoute requiredRole="admin">
                <LocationHistory />
              </ProtectedRoute>
            }
          />

          {/* 3. Personel Sayfaları (Sadece Inspector/Denetçi) */}
          <Route
            path="/personnel"
            element={
              <ProtectedRoute requiredRole="inspector">
                <PersonnelDashboard />
              </ProtectedRoute>
            }
          />

          {/* 4. Yanlış URL Koruması (Catch-all) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
