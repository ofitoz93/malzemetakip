import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScannerPage from './pages/ScannerPage';
import EquipmentDetail from './pages/EquipmentDetail';
import InspectionForm from './pages/InspectionForm'; // <--- Yeni Ekleme
import AdminDashboard from './pages/AdminDashboard';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<ScannerPage />} />
          <Route path="/equipment/:qrId" element={<EquipmentDetail />} />
          <Route path="/inspection/:qrId" element={<InspectionForm />} />{' '}
          {/* <--- Yeni Rota */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
