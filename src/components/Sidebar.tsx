import React from 'react';
import { Box, Text, Flex, VStack, Avatar } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiBarChart2, FiUsers, FiMapPin, FiSettings, FiLogOut, FiPieChart, FiDollarSign, FiDatabase } from 'react-icons/fi';
import { useAuth } from '../lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SidebarProps {
  onClose?: () => void;
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Si currentPath no se proporciona, usar location.pathname
  const activePath = currentPath || location.pathname;
  
  const navegarA = (ruta: string) => {
    navigate(ruta);
    if (onClose) onClose();
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/login');
      if (onClose) onClose();
    } catch (error) {
      alert('Error al cerrar sesión');
    }
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Ventas MVP</h2>
      </div>
      
      <div className="sidebar-user">
        <Avatar size="sm" name={user?.displayName || user?.email?.split('@')[0] || 'Usuario'} src={user?.photoURL || undefined} />
        <div className="sidebar-user-details">
          <h3 className="sidebar-user-name">{user?.displayName || user?.email?.split('@')[0] || 'Usuario'}</h3>
          <p className="sidebar-user-email">{user?.email || ''}</p>
        </div>
      </div>
      
      <nav className="sidebar-nav flex-column">
        <button 
          className={`sidebar-link ${activePath === '/' || activePath === '/dashboard' ? 'active' : ''}`} 
          onClick={() => navegarA('/')}
        >
          <FiHome className="nav-icon" /> <span>Inicio</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/ventas' ? 'active' : ''}`} 
          onClick={() => navegarA('/ventas')}
        >
          <FiShoppingBag className="nav-icon" /> <span>Ventas</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/forecast' ? 'active' : ''}`} 
          onClick={() => navegarA('/forecast')}
        >
          <FiBarChart2 className="nav-icon" /> <span>Forecast</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/clientes' ? 'active' : ''}`} 
          onClick={() => navegarA('/clientes')}
        >
          <FiUsers className="nav-icon" /> <span>Clientes</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/locations' ? 'active' : ''}`} 
          onClick={() => navegarA('/locations')}
        >
          <FiMapPin className="nav-icon" /> <span>Ubicaciones</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/estadisticas' ? 'active' : ''}`}
          onClick={() => navegarA('/estadisticas')}
        >
          <FiPieChart className="nav-icon" /> <span>Estadísticas</span>
        </button>
        
        <button 
          className={`sidebar-link ${activePath === '/configuracion' ? 'active' : ''}`}
          onClick={() => navegarA('/configuracion')}
        >
          <FiSettings className="nav-icon" /> <span>Configuración</span>
        </button>
        
            <button 
      className={`sidebar-link ${activePath === '/quickbooks-test' ? 'active' : ''}`}
      onClick={() => navegarA('/quickbooks-test')}
    >
      <FiDatabase className="nav-icon" /> <span>QuickBooks Test</span>
    </button>
    
    <button 
      className={`sidebar-link ${activePath === '/quickbooks-v3-test' ? 'active' : ''}`}
      onClick={() => navegarA('/quickbooks-v3-test')}
    >
      <FiDatabase className="nav-icon" /> <span>QuickBooks v3 Test</span>
    </button>
        
        <button 
          className={`sidebar-link ${activePath === '/admin/comisiones' ? 'active' : ''}`}
          onClick={() => navegarA('/admin/comisiones')}
        >
          <FiDollarSign className="nav-icon" /> <span>Comisiones</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <button className="sidebar-link logout-link" onClick={handleLogout}>
          <FiLogOut className="nav-icon" /> <span>Cerrar Sesión</span>
        </button>
      </div>
    </Box>
  );
};

export default Sidebar; 