// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import Manage from './pages/Manage'; // <-- add this
import DataEntry from './pages/DataEntry';
import DataEntryForm from './pages/DataEntryForm';
import AnalyticalPage from './pages/AnalyticalPage';
import DashboardHome from './pages/DashboardHome';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
};

// App Routes Component
const AppRoutes = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Dashboard Route with nested children */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard userRole={user?.role} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* /dashboard/admin-panel -> Manage module */}
        <Route path="admin-panel" element={<Manage />} />

        {/* You can add other nested routes later:
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="data-entry" element={<DataEntryPage />} />
        */}
        <Route path="data-entry" element={<DataEntry />} />
        <Route path="data-entry/:disciplineCode" element={<DataEntry />} />
        <Route path="data-entry/new" element={<DataEntryForm />} />
        <Route path="data-entry/:disciplineCode/new" element={<DataEntryForm />} />
        <Route path="data-entry/:id/:mode" element={<DataEntryForm />} />
        <Route path="analytics" element={<AnalyticalPage />} />
      </Route>

      {/* Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage onLogout={logout} userRole={user?.role} />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      {/* Catch all route */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
          icon={false}
          closeButton={false}
          toastClassName="kvk-toast"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
