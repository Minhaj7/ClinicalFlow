import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Settings } from './pages/Settings';
import { EHRInfo } from './pages/EHRInfo';
import { ProfileProvider } from './contexts/ProfileContext';

function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/ehr-info" element={<Layout><EHRInfo /></Layout>} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
