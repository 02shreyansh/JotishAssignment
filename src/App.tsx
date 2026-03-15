import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EmployeeProvider } from './context/EmployeeContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ListPage from './pages/ListPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmployeeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/list" element={<ProtectedRoute><ListPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/list" replace />} />
            <Route path="*" element={<Navigate to="/list" replace />} />
          </Routes>
        </EmployeeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}