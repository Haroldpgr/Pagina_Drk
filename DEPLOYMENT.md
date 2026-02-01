# Guía de Despliegue - Servidor de Autenticación Drk Launcher

Esta guía explica cómo desplegar el servidor de autenticación de Drk Launcher en servicios gratuitos o de bajo costo.

## 🌐 Opciones de Alojamiento

### Opción 1: Render (Recomendado - Gratis)

**Ventajas:**
- Plan gratuito disponible
- Soporte para Node.js
- HTTPS automático
- Despliegue automático desde GitHub

**Pasos:**

1. **Crear cuenta en Render:**
   - Visita: https://render.com
   - Regístrate con GitHub

2. **Crear nuevo Web Service:**
   - Click en "New" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     - **Name:** `drk-launcher-auth`
     - **Environment:** `Node`
     - **Root Directory:** `src/web`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Variables de Entorno:**
   - En la configuración del servicio, agrega:
     ```
     NODE_ENV=production
     PORT=10000
     BASE_URL=https://api.drklauncher.com
     JWT_SECRET=tu_secret_key_super_segura_aqui
     ACCESS_TOKEN_EXPIRY=86400
     REFRESH_TOKEN_EXPIRY=604800
     ```

4. **Desplegar:**
   - Render desplegará automáticamente
   - Obtendrás una URL como: `https://drk-launcher-auth.onrender.com`

### Opción 2: Railway (Gratis con límites)

**Pasos:**

1. Visita: https://railway.app
2. Conecta con GitHub
3. Crea nuevo proyecto desde repositorio
4. Configura el directorio raíz como `src/web`
5. Railway detectará automáticamente Node.js
6. Agrega variables de entorno en la configuración
7. Despliega

## 🔗 Configuración de Dominio

### Opción 1: Cloudflare (Gratis - Recomendado)

**Pasos:**

1. **Crear cuenta en Cloudflare:**
   - Visita: https://cloudflare.com
   - Regístrate gratis

2. **Agregar dominio:**
   - Si tienes un dominio, agrégalo a Cloudflare
   - Si no, puedes usar un subdominio de Cloudflare Pages

3. **Configurar DNS:**
   - Crea un registro CNAME:
     - **Name:** `api` (o el subdominio que quieras)
     - **Target:** `tu-servicio.onrender.com` (o la URL de tu servicio)
     - **Proxy:** Activado (para protección DDoS)

4. **SSL/TLS:**
   - Cloudflare proporciona SSL automático
   - Configura: SSL/TLS → Full (strict)

## 📝 Configuración Final

### 1. Actualizar URL en el Backend

En `src/web/.env`:
```env
BASE_URL=https://api.drklauncher.com
```

### 2. Actualizar URL en el Frontend

En el código del launcher, actualiza:
```typescript
const DRK_AUTH_BASE_URL = 'https://api.drklauncher.com/authserver';
```

## 🔒 Seguridad

1. **JWT_SECRET:** Usa un secreto fuerte y único
2. **HTTPS:** Siempre usa HTTPS en producción
3. **Rate Limiting:** Considera agregar rate limiting (express-rate-limit)
4. **CORS:** Configura CORS correctamente para tu dominio
5. **Variables de Entorno:** Nunca commitees `.env` con secretos reales

