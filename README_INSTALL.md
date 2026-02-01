# Instrucciones de Instalación Rápida

## Pasos para iniciar el servidor

1. **Abrir terminal en la carpeta del proyecto:**
   ```bash
   cd src/web
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Crear archivo .env:**
   Crea un archivo `.env` en `src/web/` con el siguiente contenido:
   ```
   PORT=3000
   NODE_ENV=development
   BASE_URL=http://localhost:3000
   JWT_SECRET=tu_secret_key_super_segura_aqui_cambiar_en_produccion
   ACCESS_TOKEN_EXPIRY=86400
   REFRESH_TOKEN_EXPIRY=604800
   ```

4. **Iniciar servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

   O compilar y ejecutar:
   ```bash
   npm run build
   npm start
   ```

5. **Verificar que funciona:**
   - Abre tu navegador en: http://localhost:3000
   - Deberías ver la información del servicio
   - Prueba el health check: http://localhost:3000/health

## Usuario de Prueba

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Profile:** `AdminPlayer`

¡Listo! El servidor está funcionando. 🎉

