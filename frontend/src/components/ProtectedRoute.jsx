import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Prevents unauthenticated users from accessing pages.
 * Wraps around any route that requires login.
 * 
 * @param {boolean} adminOnly - If true, only admin users can access
 */
const ProtectedRoute = ({ children, adminOnly = false, superuserOnly = false }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

    // No token = not logged in → redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Superuser-only route (e.g. User Management)
    if (superuserOnly && !isSuperuser) {
        return <Navigate to="/dashboard" replace />;
    }

    // Admin-only route but user is not admin → redirect to dashboard
    if (adminOnly && userRole !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
