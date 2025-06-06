import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiDollarSign } from 'react-icons/fi';

const AdminLayout = () => {
  console.log('Renderizando AdminLayout');
  const location = useLocation();
  useEffect(() => {
    console.log('[AdminLayout] useEffect pathname:', location.pathname);
  }, [location.pathname]);
  const handleMetricasClick = () => {
    console.log('[AdminLayout] Click en Métricas Financieras (Link) | pathname antes:', location.pathname);
    // El Link debería navegar automáticamente
    setTimeout(() => {
      console.log('[AdminLayout] pathname después del click Link:', window.location.pathname);
    }, 500);
  };
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: 220, background: '#f7fafd', borderRight: '1px solid #e0e0e0', zIndex: 1000, paddingTop: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#1a237e', marginBottom: 32, textAlign: 'center' }}>Admin</div>
        <nav className="flex-column" style={{ gap: 8, display: 'flex' }}>
          <Link to="/admin" style={{ padding: '12px 20px', color: '#222', textDecoration: 'none', fontWeight: 500 }}>
            <FiBarChart2 className="me-2 text-primary" /> Dashboard
          </Link>
          <Link to="/admin/metricas-financieras" style={{ padding: '12px 20px', color: '#222', textDecoration: 'none', fontWeight: 500 }} onClick={handleMetricasClick}>
            <FiTrendingUp className="me-2 text-success" /> Métricas Financieras
          </Link>
          <Link to="/admin/despachos" style={{ padding: '12px 20px', color: '#222', textDecoration: 'none', fontWeight: 500 }}>
            <FiBarChart2 className="me-2 text-warning" /> Despachos
          </Link>
          <Link to="/admin/comisiones" style={{ padding: '12px 20px', color: '#222', textDecoration: 'none', fontWeight: 500 }}>
            <FiDollarSign className="me-2 text-success" /> Comisiones
          </Link>
        </nav>
      </div>
      <div style={{ marginLeft: 220, width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 