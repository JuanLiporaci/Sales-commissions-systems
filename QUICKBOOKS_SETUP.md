# Configuración de Integración con QuickBooks

## Requisitos Previos

1. Una cuenta de QuickBooks Online (sandbox o producción)
2. Acceso al Developer Portal de Intuit
3. Las credenciales de la aplicación QuickBooks que proporcionaste:
   - Client ID: `ABFVl8z51AhhniDYnxWrh5HuWm4tmFUKzYTBzWs8wUdlkD5wDF`
   - Client Secret: (proporcionado por el usuario)

## Configuración en Vercel

### 1. Variables de Entorno Requeridas

Agrega las siguientes variables de entorno en tu proyecto de Vercel:

```bash
# QuickBooks Integration
VITE_QB_CLIENT_SECRET=tu_client_secret_aqui
VITE_QB_REDIRECT_URI=https://tu-dominio.vercel.app/auth/quickbooks/callback
```

### 2. Configuración de la Aplicación QuickBooks

1. Ve al [Developer Portal de Intuit](https://developer.intuit.com/)
2. Accede a tu aplicación QuickBooks
3. En la configuración de la aplicación, asegúrate de que:
   - **Redirect URI**: `https://tu-dominio.vercel.app/auth/quickbooks/callback`
   - **Environment**: Sandbox (para pruebas) o Production (para uso real)
   - **Scopes**: `com.intuit.quickbooks.accounting`

## Funcionalidades Implementadas

### 1. Autenticación OAuth2
- Conexión segura con QuickBooks usando OAuth2
- Manejo automático de tokens de acceso y refresh
- Almacenamiento seguro de credenciales en localStorage

### 2. Sincronización de Clientes
- Importación automática de clientes desde QuickBooks
- Mapeo de direcciones de facturación y envío
- Información de contacto (teléfono, email)
- Sincronización bidireccional con Firestore

### 3. Sincronización de Productos
- Importación de productos y servicios desde QuickBooks
- Precios y costos actualizados automáticamente
- Información de inventario (SKU, cantidad disponible)
- Categorización por tipo de producto

### 4. Gestión de Precios
- Precios actualizados en tiempo real desde QuickBooks
- Costos de productos para análisis de rentabilidad
- Sincronización automática de cambios de precios

## Uso en la Aplicación

### 1. Conectar con QuickBooks
1. Ve a la página de **Configuración**
2. En la sección "Conexión con QuickBooks", haz clic en "Conectar con QuickBooks"
3. Autoriza la aplicación en QuickBooks
4. Serás redirigido de vuelta a la aplicación

### 2. Sincronizar Datos
1. Una vez conectado, usa los botones de sincronización:
   - **Sincronizar Clientes**: Importa clientes y direcciones
   - **Sincronizar Productos**: Importa productos y precios
   - **Sincronizar Todo**: Ejecuta ambas sincronizaciones

### 3. Datos Sincronizados

#### Clientes
- Nombre y nombre completo
- Dirección de facturación
- Dirección de envío (si es diferente)
- Teléfono principal
- Email principal
- ID de QuickBooks para referencia

#### Productos
- Nombre del producto
- Descripción
- Precio unitario
- Costo de compra
- SKU
- Tipo (Inventario/No Inventario)
- Cantidad disponible (si aplica)
- Estado activo/inactivo

## Flujo de Datos

```
QuickBooks Online ←→ API OAuth2 ←→ Aplicación ←→ Firestore
```

1. **Autenticación**: OAuth2 flow para obtener tokens de acceso
2. **Consulta**: API calls a QuickBooks para obtener datos
3. **Procesamiento**: Formateo y validación de datos
4. **Almacenamiento**: Sincronización con Firestore
5. **Uso**: Datos disponibles en toda la aplicación

## Consideraciones de Seguridad

- Los tokens se almacenan en localStorage (solo para el cliente)
- No se almacenan credenciales sensibles en el código
- Las variables de entorno están protegidas en Vercel
- Los tokens tienen expiración automática

## Troubleshooting

### Error: "QuickBooks no está autenticado"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que la aplicación esté conectada a QuickBooks
- Revisa que el Client Secret sea correcto

### Error: "Parámetros de autorización faltantes"
- Verifica que la URL de callback esté configurada correctamente
- Asegúrate de que el redirect URI coincida en QuickBooks y Vercel

### Error: "Failed to exchange code for token"
- Verifica que el Client Secret sea correcto
- Asegúrate de que la aplicación esté en el ambiente correcto (sandbox/production)

## Próximos Pasos

1. **Configurar variables de entorno en Vercel**
2. **Probar la conexión en sandbox**
3. **Sincronizar datos de prueba**
4. **Migrar a producción cuando esté listo**

## Soporte

Si encuentras problemas con la integración:
1. Revisa los logs de la consola del navegador
2. Verifica la configuración de variables de entorno
3. Confirma que la aplicación QuickBooks esté configurada correctamente
4. Contacta al equipo de desarrollo si persisten los problemas 