# Configuración de Variables de Entorno en Vercel

Para que el sistema funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno con los datos de tu archivo `firebase-credentials.json`.

## Variables Requeridas

Ve a tu **Dashboard de Vercel** → **Tu Proyecto** → **Settings** → **Environment Variables** y agrega:

### 1. VITE_SPREADSHEET_ID
- **Valor**: El ID de tu Google Spreadsheet
- **Ejemplo**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2. VITE_FIREBASE_PROJECT_ID  
- **Valor**: Copia el valor de `project_id` desde tu `firebase-credentials.json`
- **Ejemplo**: `scsf-32dcf`

### 3. VITE_FIREBASE_CLIENT_EMAIL
- **Valor**: Copia el valor de `client_email` desde tu `firebase-credentials.json`  
- **Ejemplo**: `firebase-adminsdk-fbsvc@scsf-32dcf.iam.gserviceaccount.com`

### 4. VITE_FIREBASE_PRIVATE_KEY
- **Valor**: Copia TODA la clave privada desde tu `firebase-credentials.json`
- **IMPORTANTE**: Copia el contenido completo incluyendo:
  ```
  -----BEGIN PRIVATE KEY-----
  [contenido de la clave]
  -----END PRIVATE KEY-----\n
  ```

### 5. VITE_FIREBASE_CLIENT_ID (Opcional)
- **Valor**: Copia el valor de `client_id` desde tu `firebase-credentials.json`

## Pasos para Configurar

1. **Abrir tu archivo local** `firebase-credentials.json`
2. **Ir a Vercel Dashboard** → Settings → Environment Variables
3. **Agregar cada variable** con su valor correspondiente
4. **Importante**: Selecciona **Production**, **Preview**, y **Development** para cada variable
5. **Redeploy** tu aplicación

## Ejemplo de cómo copiar la private_key

En tu `firebase-credentials.json`, verás algo así:
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

**Copia exactamente ese valor** (incluyendo `\n` al final) en la variable `VITE_FIREBASE_PRIVATE_KEY`.

## Verificación

Después de configurar las variables:
1. Ve a **Deployments** en Vercel
2. Click en **Redeploy** en el último deployment
3. Espera a que complete
4. Tu aplicación debe funcionar correctamente

## Seguridad

✅ **Estas variables están seguras** en Vercel y no se exponen públicamente.
✅ **No incluyas** el archivo `firebase-credentials.json` en tu repositorio.
✅ **Mantén** el archivo en `.gitignore`.

## Solución de Problemas

Si aún hay errores:
1. Verifica que todas las variables estén configuradas
2. Revisa que no haya espacios extra en los valores
3. Asegúrate de que la `private_key` esté completa
4. Redeploy nuevamente desde Vercel 