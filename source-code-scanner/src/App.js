import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import theme
import theme from './theme';

// Import providers
import { ScanProvider } from './contexts/ScanContext';
import { AuthProvider } from './contexts/AuthContext';

// Import layouts
import MainLayout from './layouts/MainLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/ScannerPage';
import ReportsPage from './pages/ReportsPage';
import VulnerabilitiesPage from './pages/Vulnerabilities';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/user/Profile';
import ChangePassword from './pages/user/ChangePassword';
import ForgotPassword from './pages/auth/ForgotPassword';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScanProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="scanner" element={<ScannerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="change-password" element={<ChangePassword />} />
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </ScanProvider>
    </ThemeProvider>
  );
}

export default App;