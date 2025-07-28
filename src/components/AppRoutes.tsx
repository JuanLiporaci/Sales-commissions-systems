import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Layout from './Layout';
import Estadisticas from '../pages/Estadisticas';
import MetricasFinancieras from '../pages/MetricasFinancieras';
import Ventas from '../pages/Ventas';
import Forecast from '../pages/Forecast';
import Clientes from '../pages/Clientes';
import Locations from '../pages/Locations';
import Configuracion from '../pages/Configuracion';
import QuickBooksCallback from '../pages/QuickBooksCallback';
import MetricasFinancierasRedirect from './MetricasFinancierasRedirect';
import AdminDashboard from '../pages/AdminDashboard';
import Inventory from '../pages/Inventory';
import Reportes from '../pages/Reportes';
import AdminLayout from './AdminLayout';
import DespachosAdmin from '../pages/DespachosAdmin';
import AdminComisiones from '../pages/AdminComisiones';
import Despachos from '../pages/Despachos';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import QuickBooksTest from './QuickBooksTest';

const PrivateRoute = ({ children, noLayout }: { children: React.ReactNode, noLayout?: boolean }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  console.log('[PrivateRoute] pathname:', location.pathname, '| user:', user);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('[PrivateRoute] No user, redirigiendo a /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = (user as any).admin;
  const isAdminAllowed = location.pathname.startsWith('/admin');
  console.log('[PrivateRoute] isAdmin:', isAdmin, '| isAdminAllowed:', isAdminAllowed, '| pathname:', location.pathname);

  if (isAdmin && !isAdminAllowed) {
    console.log('[PrivateRoute] Redirigiendo admin a /admin desde', location.pathname);
    return <Navigate to="/admin" replace />;
  }
  if (!isAdmin && isAdminAllowed) {
    console.log('[PrivateRoute] Redirigiendo usuario normal a /dashboard desde', location.pathname);
    return <Navigate to="/dashboard" replace />;
  }

  if (noLayout) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  console.log('AppRoutes location:', location.pathname);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    if ((user as any).admin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute noLayout={true}><Dashboard /></PrivateRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute noLayout={true}><Dashboard /></PrivateRoute>} />
      <Route path="/ventas" element={<PrivateRoute noLayout={true}><Ventas /></PrivateRoute>} />
      <Route path="/forecast" element={<PrivateRoute noLayout={true}><Forecast /></PrivateRoute>} />
      <Route path="/clientes" element={<PrivateRoute noLayout={true}><Clientes /></PrivateRoute>} />
      <Route path="/locations" element={<PrivateRoute noLayout={true}><Locations /></PrivateRoute>} />
      <Route path="/estadisticas" element={<PrivateRoute noLayout={true}><Estadisticas /></PrivateRoute>} />
      <Route path="/finanzas" element={<PrivateRoute noLayout={true}><MetricasFinancierasRedirect /></PrivateRoute>} />
      <Route path="/metricas" element={<PrivateRoute noLayout={true}><MetricasFinancierasRedirect /></PrivateRoute>} />
      <Route path="/configuracion" element={<PrivateRoute noLayout={true}><Configuracion /></PrivateRoute>} />
      <Route path="/callback" element={<QuickBooksCallback />} />
      <Route path="/admin" element={<PrivateRoute noLayout={true}><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="metricas-financieras" element={<MetricasFinancieras />} />
        <Route path="despachos" element={<DespachosAdmin />} />
        <Route path="comisiones" element={<AdminComisiones />} />
      </Route>
      <Route path="/inventario" element={<PrivateRoute><Inventory /></PrivateRoute>} />
      <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/quickbooks-test" element={<PrivateRoute noLayout={true}><QuickBooksTest /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 