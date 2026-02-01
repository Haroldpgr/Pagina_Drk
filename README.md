# Servidor de Autenticación Drk Launcher

Servidor backend para el sistema de autenticación y API de skins de Drk Launcher. Implementa el protocolo Yggdrasil (Mojang Legacy Auth).

## 🚀 Características

- ✅ Autenticación de usuarios (POST /authserver/authenticate)
- ✅ Refresco de tokens (POST /authserver/refresh)
- ✅ Validación de tokens (POST /authserver/validate)
- ✅ API de perfiles y skins (GET /sessionserver/session/minecraft/profile/<UUID>)
- ✅ Almacenamiento en memoria (desarrollo) - Listo para migrar a base de datos real

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🔧 Instalación

1. Instalar dependencias:
```bash
cd src/web
npm install
```

2. Configurar variables de entorno:
```bash
# Crear archivo .env en src/web/
# Copiar el contenido de .env.example
```

3. Compilar TypeScript:
```bash
npm run build
```

4. Iniciar servidor:
```bash
npm start
```

Para desarrollo con hot-reload:
```bash
npm run dev
```

## 🔐 Usuario de Prueba

El servidor incluye un usuario de prueba por defecto:

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Profile:** `AdminPlayer`

## 📡 Endpoints

### Autenticación

- `POST /authserver/authenticate` - Autenticar usuario
- `POST /authserver/refresh` - Refrescar token
- `POST /authserver/validate` - Validar token

### Sesiones

- `GET /sessionserver/session/minecraft/profile/<UUID>` - Obtener perfil con texturas

### Utilidades

- `GET /health` - Estado del servidor
- `GET /` - Información del servicio

## 🌐 Despliegue

Ver `DEPLOYMENT.md` para instrucciones detalladas de despliegue.

## 📝 Notas

- Este servidor usa almacenamiento en memoria para desarrollo
- Para producción, migrar a una base de datos real (PostgreSQL, MongoDB, etc.)
- Las contraseñas se hashean con bcrypt
- Los tokens expiran según `ACCESS_TOKEN_EXPIRY` en `.env`

