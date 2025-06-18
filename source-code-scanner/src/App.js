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
import Dashboard from './components/Dashboard/Dashboard';
import ScannerPage from './components/Scanner/ScannerPage';
import ReportsPage from './components/Reports/ReportsPage';
import VulnerabilitiesPage from './components/Vulnerabilities/Vulnerabilities';
import VulnerabilityDetails from './components/Vulnerabilities/VulnerabilityDetails';
import SettingsPage from './components/Settings/SettingsPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/user/Profile';
import ChangePassword from './pages/user/ChangePassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import IssueDetailsPage from './components/Reports/IssueDetailsPage';

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
                <Route path="reports/:id" element={<ReportsPage />} />
                <Route path="reports/:id/issues" element={<IssueDetailsPage />} />
                <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
                <Route path="vulnerabilities/:id" element={<VulnerabilityDetails />} />
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