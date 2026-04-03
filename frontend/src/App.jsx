import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Register from './pages/Register';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import TransactionHistory from './pages/TransactionHistory';
import SalesDashboard from './pages/SalesDashboard';
import LowStockAlerts from './pages/LowStockAlerts';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/inventory" element={
          <PrivateRoute>
            <Inventory />
          </PrivateRoute>
        } />
        <Route path="/register" element={
          <PrivateRoute>
            <Register />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/alerts" element={
          <PrivateRoute>
            <LowStockAlerts />
          </PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <TransactionHistory />
          </PrivateRoute>
        } />
        <Route path="/sales-dashboard" element={
          <PrivateRoute>
            <SalesDashboard />
          </PrivateRoute>
        } />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
