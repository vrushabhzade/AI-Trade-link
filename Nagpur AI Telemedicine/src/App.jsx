/* eslint-disable */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { LanguageProvider } from './context/LanguageContext';

import FindDoctors from './pages/FindDoctors';
import VideoConsult from './pages/VideoConsult';
import Prescriptions from './pages/Prescriptions';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientProfile from './pages/PatientProfile';
import AdminDashboard from './pages/AdminDashboard';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder pages
const Consultant = () => <div className="container" style={{ paddingTop: '6rem' }}><h1>Consultation</h1></div>;

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main>
              <Routes>
                {/* Direct access to Dashboard, bypassing Landing Page and Login */}
                <Route path="/" element={<Dashboard />} />

                {/* Keep these if user wants to switch context, but hide from main flow */}
                <Route path="/login" element={<Dashboard />} />
                <Route path="/register" element={<Dashboard />} />

                {/* Protected Routes (Technically "protected" but user is always guest-authed now) */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
                <Route path="/find-doctors" element={<ProtectedRoute><FindDoctors /></ProtectedRoute>} />
                <Route path="/video-consult" element={<ProtectedRoute><VideoConsult /></ProtectedRoute>} />
                <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
                <Route path="/consult" element={<ProtectedRoute><Consultant /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
