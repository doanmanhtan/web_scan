// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';

// // Import theme
// import theme from './theme';

// // Import layouts
// import MainLayout from './layouts/MainLayout';

// // Import pages
// import Dashboard from './pages/Dashboard';
// import ScannerPage from './pages/ScannerPage';
// import ReportsPage from './pages/ReportsPage';
// import VulnerabilitiesPage from './pages/Vulnerabilities';
// import SettingsPage from './pages/SettingsPage';

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Router>
//         <Routes>
//           <Route path="/" element={<MainLayout />}>
//             <Route index element={<Dashboard />} />
//             <Route path="scanner" element={<ScannerPage />} />
//             <Route path="reports" element={<ReportsPage />} />
//             <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
//             <Route path="settings" element={<SettingsPage />} />
//           </Route>
//         </Routes>
//       </Router>
//     </ThemeProvider>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import theme
import theme from './theme';

// Import providers
import { ScanProvider } from './contexts/ScanContext';

// Import layouts
import MainLayout from './layouts/MainLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/ScannerPage';
import ReportsPage from './pages/ReportsPage';
import VulnerabilitiesPage from './pages/Vulnerabilities';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScanProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </ScanProvider>
    </ThemeProvider>
  );
}

export default App;