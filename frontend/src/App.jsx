import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes - require login */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/create-complaint" element={
          <ProtectedRoute adminOnly><CreateComplaint /></ProtectedRoute>
        } />
        <Route path="/complaints/:id" element={
          <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
        } />

        {/* Superuser-only route */}
        <Route path="/admin/users" element={
          <ProtectedRoute superuserOnly><UserManagement /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
