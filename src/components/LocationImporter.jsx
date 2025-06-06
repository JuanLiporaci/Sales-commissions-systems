import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Spinner } from 'react-bootstrap';
import { FiUpload, FiCheck, FiAlertCircle, FiInfo, FiLock } from 'react-icons/fi';
import { parseCSV, processLocationData, fileToText } from '../utils/sheetsImporter.js';
import { locationsService } from '../services/locations.js';
import { auth } from '../lib/firebase.ts';

const LocationImporter = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locationCount, setLocationCount] = useState(0);
  const [processedData, setProcessedData] = useState(null);

  // Verificar token de autenticación al cargar
  useEffect(() => {
    const checkToken = async () => {
      try {
        if (auth.currentUser) {
          // Forzar la actualización del token
          await auth.currentUser.getIdToken(true);
          console.log("Token de autenticación renovado");
        }
      } catch (err) {
        console.error("Error renovando token:", err);
      }
    };
    
    checkToken();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setProcessedData(null);
    }
  };

  const processFile = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo CSV');
      return false;
    }

    try {
      const fileContent = await fileToText(file);
      if (!fileContent) {
        setError('No se pudo leer el contenido del archivo. Intente con otro archivo CSV.');
        return false;
      }
      
      const parsedData = parseCSV(fileContent);
      
      if (!parsedData || parsedData.length === 0) {
        setError('No se pudo extraer información del archivo. Verifique que el formato sea CSV válido.');
        return false;
      }
      
      // Imprimir los encabezados del CSV para debug
      if (parsedData[0]) {
        console.log("Encabezados del CSV:", Object.keys(parsedData[0]));
      }
      
      // Process the data into our location format
      const locationData = processLocationData(parsedData);
      
      if (!locationData || locationData.length === 0) {
        setError('No se encontraron ubicaciones válidas en el archivo. Verifique que el formato del CSV contenga las columnas requeridas.');
        return false;
      }
      
      console.log(`Se procesaron ${locationData.length} ubicaciones del CSV`);
      setProcessedData(locationData);
      return true;
      
    } catch (err) {
      console.error('Error procesando el archivo:', err);
      setError(`Error procesando el archivo: ${err.message}`);
      return false;
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo CSV');
      return;
    }

    // Check if user is authenticated
    if (!auth.currentUser) {
      try {
        // Intentar renovar la sesión
        await auth.currentUser?.getIdToken(true);
      } catch (err) {
        setError('Debe iniciar sesión para importar ubicaciones. Por favor inicie sesión nuevamente.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let dataToImport = processedData;
      
      // Si los datos aún no están procesados, procesar el archivo
      if (!dataToImport) {
        const processingSuccess = await processFile();
        if (!processingSuccess) {
          setIsLoading(false);
          return;
        }
        dataToImport = processedData;
      }
      
      if (!dataToImport || dataToImport.length === 0) {
        setError('No hay datos válidos para importar. Verifique el archivo CSV.');
        setIsLoading(false);
        return;
      }
      
      // Import locations to Firebase
      console.log(`Importando ${dataToImport?.length || 0} ubicaciones a Firebase...`);
      await locationsService.importLocationsFromData(dataToImport);
      
      setLocationCount(dataToImport?.length || 0);
      setSuccess(true);
      
      // Call the callback with the imported data
      if (onImportComplete) {
        onImportComplete(dataToImport);
      }
    } catch (err) {
      console.error('Error al importar:', err);
      
      // Handle permission errors specifically
      if (err.code === 'permission-denied') {
        setError('Permiso denegado. Verifique que tiene acceso para escribir en la base de datos. Las reglas de seguridad pueden estar bloqueando la operación.');
      } else if (err.message && err.message.includes('permission')) {
        setError('Error de permisos: No tiene suficientes permisos para realizar esta operación. Pruebe cerrar sesión y volver a iniciar.');
      } else {
        setError(err.message || 'Error al importar el archivo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="py-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FiUpload className="me-2 text-primary" /> 
          Importar Ubicaciones de Entrega
        </h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Seleccione un archivo CSV exportado desde QuickBooks que contenga la información de clientes y ubicaciones de entrega.
        </p>
        
        <Alert variant="info" className="d-flex align-items-start mb-3">
          <FiInfo className="me-2 mt-1" />
          <div>
            <p className="mb-1"><strong>Formato esperado del CSV:</strong></p>
            <p className="mb-0 small">
              El archivo puede contener las columnas: <code>Customer full name</code>, <code>Phone numbers</code>, 
              <code>Email</code>, <code>Full name</code>, <code>Bill address</code>, <code>Ship address</code> o columnas genéricas como
              <code>nombre</code>, <code>dirección</code>, <code>ciudad</code>, etc.
            </p>
          </div>
        </Alert>
        
        {error && (
          <Alert variant="danger" className="d-flex align-items-start mb-3">
            <FiAlertCircle className="me-2 mt-1" />
            <div>
              <div>{error}</div>
              {(error.includes('permiso') || error.includes('Permiso')) && (
                <div className="mt-2 small">
                  <FiLock className="me-1" /> Esto generalmente ocurre por problemas de autenticación. Hemos actualizado las reglas de seguridad para permitir acceso completo durante desarrollo.
                </div>
              )}
            </div>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="d-flex align-items-center mb-3">
            <FiCheck className="me-2" />
            Se importaron {locationCount} ubicaciones correctamente
          </Alert>
        )}
        
        <Form.Group controlId="csvFile" className="mb-3">
          <Form.Label>Archivo CSV</Form.Label>
          <Form.Control 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Form.Text className="text-muted">
            Las direcciones de facturación (Bill address) se utilizarán como ubicaciones de entrega. 
            También puede exportar reportes de clientes desde QuickBooks.
          </Form.Text>
        </Form.Group>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={processFile} 
            disabled={!file || isLoading}
            className="d-flex align-items-center"
          >
            <FiCheck className="me-2" /> Verificar CSV
          </Button>
          
          <div className="flex-grow-1">
            <Button 
              variant="primary" 
              onClick={handleImport} 
              disabled={!file || isLoading}
              className="d-flex align-items-center justify-content-center w-100"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Importando...
                </>
              ) : (
                <>
                  <FiUpload className="me-2" /> Importar Ubicaciones
                </>
              )}
            </Button>
          </div>
        </div>
        
        {processedData && processedData.length > 0 && !error && !success && (
          <Alert variant="success" className="mt-3">
            <FiCheck className="me-2" /> 
            CSV procesado correctamente. Contiene {processedData.length} ubicaciones listas para importar.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default LocationImporter; 