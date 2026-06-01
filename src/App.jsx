import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OldInvoices from './components/OldInvoices';
import LivePreview from './components/LivePreview';

// Route protection wrapper
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/old-invoices" 
          element={
            <PrivateRoute>
              <OldInvoices />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/live-preview" 
          element={
            <PrivateRoute>
              <LivePreview />
            </PrivateRoute>
          } 
        />
        {/* Wildcard redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
