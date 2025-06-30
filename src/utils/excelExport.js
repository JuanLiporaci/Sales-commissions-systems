import ExcelJS from 'exceljs';

/**
 * Exportar datos de array de arrays a Excel
 * @param {Array<Array>} data - Datos en formato array de arrays
 * @param {string} filename - Nombre del archivo
 * @param {string} sheetName - Nombre de la hoja
 */
export const exportArrayToExcel = async (data, filename, sheetName = 'Hoja1') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Agregar filas de datos
    data.forEach(row => {
      worksheet.addRow(row);
    });
    
    // Aplicar estilos a la primera fila (header)
    if (data.length > 0) {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50); // Máximo 50 caracteres
    });
    
    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    throw error;
  }
};

/**
 * Exportar datos de array de objetos a Excel
 * @param {Array<Object>} data - Datos en formato array de objetos
 * @param {string} filename - Nombre del archivo
 * @param {string} sheetName - Nombre de la hoja
 */
export const exportObjectsToExcel = async (data, filename, sheetName = 'Hoja1') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Obtener las claves del primer objeto como headers
    const headers = Object.keys(data[0]);
    
    // Agregar headers
    worksheet.addRow(headers);
    
    // Agregar datos
    data.forEach(item => {
      const row = headers.map(header => item[header] || '');
      worksheet.addRow(row);
    });
    
    // Aplicar estilos a la primera fila (header)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50); // Máximo 50 caracteres
    });
    
    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    throw error;
  }
}; 