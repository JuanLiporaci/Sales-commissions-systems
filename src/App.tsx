import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './components/AppRoutes';
import QuickBooksAutoConnector from './components/QuickBooksAutoConnector';

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