import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './components/AppRoutes';
import { useQuickBooksAutoConnect } from './hooks/useQuickBooksAutoConnect';

// Component to handle QuickBooks auto-connection
const QuickBooksAutoConnector = () => {
  const { isConnected, isConnecting, error } = useQuickBooksAutoConnect();

  // This component doesn't render anything, it just handles the connection
  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <QuickBooksAutoConnector />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;