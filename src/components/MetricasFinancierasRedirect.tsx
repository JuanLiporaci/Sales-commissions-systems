import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Este componente simplemente redirige a métricas financieras
const MetricasFinancierasRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/metricas-financieras', { replace: true });
  }, [navigate]);

  return <div>Redirigiendo a métricas financieras...</div>;
};

export default MetricasFinancierasRedirect; 