# Configuración de Google Sheets

## Integración Automática de Pedidos

Esta aplicación ahora envía automáticamente cada pedido/venta registrado a un Google Sheet configurado.

### Variables de Entorno Requeridas

Agrega la siguiente variable a tu archivo `.env` y en tu configuración de Vercel:

```env
VITE_SPREADSHEET_ID=tu_id_del_google_sheet_aqui
```

### Cómo obtener el ID del Google Sheet

1. Ve a tu Google Sheet
2. Copia la URL, se ve así: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
3. El ID es la parte larga entre `/d/` y `/edit`: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Configuración de la Hoja "web"

El sistema enviará los datos específicamente a la hoja llamada **"web"** dentro de tu Google Spreadsheet.

Asegúrate de que:
1. Tu Google Spreadsheet tenga una hoja/pestaña llamada exactamente **"web"**
2. Esta hoja tenga las columnas correctas en la fila 1

### Columnas de la Hoja "web"

El sistema enviará los datos en este orden (asegúrate de que la hoja "web" tenga estas columnas en la fila 1):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Nombre del Cliente | Productos | Cantidad | Fecha de Despacho | codigo | Notas | Usuario | Fecha de subida | Proveedor |

### Configuración de Permisos

El sistema usa las credenciales de servicio de Firebase (`firebase-credentials.json`) que ya tienes configuradas.

Asegúrate de que:
1. El Google Sheet sea accesible por la cuenta de servicio (email: `firebase-adminsdk-fbsvc@scsf-32dcf.iam.gserviceaccount.com`)
2. El sheet tenga permisos de edición para esta cuenta

### Datos que se envían

Para cada venta registrada, se envía:

- **Nombre del Cliente**: El nombre del cliente seleccionado
- **Productos**: Lista de productos vendidos (separados por comas)
- **Cantidad**: Cantidades de cada producto (separadas por comas)
- **Fecha de Despacho**: La fecha de la venta
- **codigo**: Códigos de los productos (separados por comas)
- **Notas**: Notas de la venta
- **Usuario**: Email del usuario que registró la venta
- **Fecha de subida**: Timestamp de cuando se envió al sheet
- **Proveedor**: "Sistema Ventas" (fijo)

### Funcionamiento

La integración funciona automáticamente:
- Cada vez que se registra una venta exitosamente en el sistema
- Los datos se envían específicamente a la hoja **"web"** del Google Sheet configurado
- Si hay algún error con Google Sheets, la venta se guarda normalmente y solo se registra el error en la consola
- No interrumpe el flujo normal de ventas

### Troubleshooting

Si no aparecen datos en el Google Sheet:

1. **Verifica que existe la hoja "web"**: Asegúrate de que tu Google Spreadsheet tenga una pestaña/hoja llamada exactamente **"web"**
2. Verifica que `VITE_SPREADSHEET_ID` esté configurado correctamente
3. Verifica que el Google Sheet tenga los permisos correctos para la cuenta de servicio
4. Revisa la consola del navegador para ver si hay errores de autenticación
5. Asegúrate de que las columnas estén en el orden correcto en la hoja "web" 