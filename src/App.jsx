import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import CustomerMenu from './pages/CustomerMenu';
import OrderConfirmation from './pages/OrderConfirmation';
import KitchenDashboard from './pages/KitchenDashboard';
import QRGenerator from './pages/QRGenerator';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const location = useLocation();

  // Hide top public navbar on Admin Panel to maximize workspace
  const isDedicatedAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#FDF8F2] text-[#2A2521] flex flex-col font-sans">
      
      {/* Toast Notification Container with Cafe Theming */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E130D',
            color: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(223, 155, 82, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            fontSize: '13px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#2D8A4E',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      {/* Public / Staff Top Navbar */}
      {!isDedicatedAdmin && <Navbar />}

      {/* Main Viewport Routes */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/menu?table=1" replace />} />
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/qr" element={<QRGenerator />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/menu?table=1" replace />} />
        </Routes>
      </div>

    </div>
  );
}
