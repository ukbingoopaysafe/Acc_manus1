import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Units from './components/Units';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Rentals from './components/Rentals';
import FinishingWorks from './components/FinishingWorks';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Users from './components/Users';
import PrintExport from './components/PrintExport';
import DynamicCalculations from './components/DynamicCalculations';
import DynamicPrintExport from './components/DynamicPrintExport';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
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
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="units" element={<Units />} />
                <Route path="sales" element={<Sales />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="rentals" element={<Rentals />} />
                <Route path="finishing-works" element={<FinishingWorks />} />
                <Route path="reports" element={<Reports />} />
                <Route path="print-export" element={<PrintExport />} />
                <Route path="settings" element={<Settings />} />
                <Route path="dynamic-calculations" element={<DynamicCalculations />} />
                <Route path="dynamic-print-export" element={<DynamicPrintExport />} />
                <Route path="users" element={<Users />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

