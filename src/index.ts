/**
 * Servidor de Autenticación y API de Skins para Drk Launcher
 * Backend principal
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import sessionsRoutes from './routes/sessions';
import launcherRoutes from './routes/launcher';
import { initializeDatabase, cleanupExpiredSessions, createUser, createProfile } from './database/memoryStore';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (ANTES de servir archivos estáticos para capturar todas las rutas)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const fullUrl = `http://localhost:${PORT}${req.path}`;
  console.log(`[${timestamp}] ${req.method} ${fullUrl}`);
  console.log(`[Route] Ruta completa: ${fullUrl}`);
  console.log(`[Route] Método: ${req.method}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`[Route] Query params:`, req.query);
  }
  next();
});

// Rutas de API (ANTES de archivos estáticos)
app.use('/authserver', authRoutes);
app.use('/sessionserver', sessionsRoutes);
app.use('/launcher', launcherRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DRK Launcher Auth Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rutas específicas de páginas (ANTES de archivos estáticos para evitar conflictos)
app.get('/', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/ -> Sirviendo landing.html (Página de inicio)`);
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Rutas sin .html
app.get('/login', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/login -> Sirviendo index.html (login)`);
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/home', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/home -> Sirviendo home.html`);
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

app.get('/skins', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/skins -> Sirviendo skins.html`);
  res.sendFile(path.join(__dirname, '../public/skins.html'));
});

app.get('/layers', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/layers -> Sirviendo layers.html`);
  res.sendFile(path.join(__dirname, '../public/layers.html'));
});

app.get('/servers', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/servers -> Sirviendo servers.html`);
  res.sendFile(path.join(__dirname, '../public/servers.html'));
});

app.get('/community', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/community -> Sirviendo community.html`);
  res.sendFile(path.join(__dirname, '../public/community.html'));
});

app.get('/changelog', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/changelog -> Sirviendo changelog.html`);
  res.sendFile(path.join(__dirname, '../public/changelog.html'));
});

app.get('/faq', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/faq -> Sirviendo faq.html`);
  res.sendFile(path.join(__dirname, '../public/faq.html'));
});

app.get('/download', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/download -> Sirviendo download.html`);
  res.sendFile(path.join(__dirname, '../public/download.html'));
});

// Mantener compatibilidad con rutas .html
app.get('/login.html', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/login.html -> Sirviendo index.html (login)`);
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/home.html', (req, res) => {
  console.log(`[Route Handler] GET http://localhost:${PORT}/home.html -> Sirviendo home.html`);
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

// Servir archivos estáticos (imágenes, CSS, JS) DESPUÉS de las rutas específicas
app.use(express.static(path.join(__dirname, '../public')));

// API de registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, profileName } = req.body;

    if (!username || !email || !password || !profileName) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'Todos los campos son requeridos.'
      });
    }

    // Verificar si el usuario ya existe
    const { findUserByEmailOrUsername } = await import('./database/memoryStore');
    const existingUser = await findUserByEmailOrUsername(username) || await findUserByEmailOrUsername(email);
    
    if (existingUser) {
      return res.status(400).json({
        error: 'UserExists',
        message: 'El usuario o email ya está registrado.'
      });
    }

    // Crear usuario
    const user = await createUser(username, email, password);
    
    // Crear perfil de Minecraft
    await createProfile(user.id, profileName);

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      userId: user.id
    });
  } catch (error: any) {
    console.error('[Register] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al crear la cuenta'
    });
  }
});

// API para obtener información del usuario (requiere autenticación)
app.get('/api/user/info', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, findUserById } = await import('./database/memoryStore');
    
    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Usuario no encontrado.'
      });
    }

    const { getUserProfiles } = await import('./database/memoryStore');
    const profiles = await getUserProfiles(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      profiles: profiles.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt
      }))
    });
  } catch (error: any) {
    console.error('[User Info] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener información del usuario'
    });
  }
});

// API para obtener skins del usuario
app.get('/api/user/skins', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    console.log('[User Skins GET] Token recibido:', {
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...',
      tokenEnd: '...' + accessToken.substring(accessToken.length - 10)
    });
    
    const { findSessionByAccessToken, getUserSkins } = await import('./database/memoryStore');
    
    const session = await findSessionByAccessToken(accessToken);
    console.log('[User Skins GET] Sesión encontrada:', {
      hasSession: !!session,
      userId: session?.userId,
      username: session?.username,
      expiresAt: session?.expiresAt,
      isExpired: session?.expiresAt ? new Date(session.expiresAt) < new Date() : null
    });
    
    // Si no se encuentra la sesión, intentar buscar por userId usando el token de la página web
    if (!session) {
      console.warn('[User Skins GET] Sesión no encontrada. Esto puede significar que:');
      console.warn('  1. El servidor se reinició y perdió las sesiones en memoria');
      console.warn('  2. El token en localStorage no coincide con el token de la sesión del servidor');
      console.warn('  3. La sesión expiró');
      console.warn('  Solución: Inicia sesión de nuevo en la página web para crear una nueva sesión');
    }
    
    if (!session) {
      console.warn('[User Skins GET] No se encontró sesión para el token proporcionado');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }
    
    // Verificar si la sesión ha expirado
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      console.warn('[User Skins GET] Sesión expirada:', {
        expiresAt: session.expiresAt,
        now: new Date()
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado.'
      });
    }

    const skins = await getUserSkins(session.userId);

    res.json({
      success: true,
      skins: skins.map(skin => ({
        id: skin.id,
        name: skin.name,
        url: skin.url,
        uploadedAt: skin.uploadedAt
      }))
    });
  } catch (error: any) {
    console.error('[User Skins] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener skins del usuario'
    });
  }
});

// API para subir una skin
app.post('/api/user/skins', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, addUserSkin } = await import('./database/memoryStore');
    
    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'Nombre y URL de la skin son requeridos.'
      });
    }

    const newSkin = await addUserSkin(session.userId, name, url);

    res.json({
      success: true,
      skin: {
        id: newSkin.id,
        name: newSkin.name,
        url: newSkin.url,
        uploadedAt: newSkin.uploadedAt
      }
    });
  } catch (error: any) {
    console.error('[Upload Skin] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al subir la skin'
    });
  }
});

// API para obtener la skin activa del usuario
app.get('/api/user/skin/active', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    console.log('[User Active Skin GET] Token recibido:', {
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...',
      tokenEnd: '...' + accessToken.substring(accessToken.length - 10)
    });

    const { findSessionByAccessToken, getUserActiveSkin } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    console.log('[User Active Skin GET] Sesión encontrada:', {
      hasSession: !!session,
      userId: session?.userId,
      username: session?.username,
      expiresAt: session?.expiresAt,
      isExpired: session?.expiresAt ? new Date(session.expiresAt) < new Date() : null
    });

    if (!session) {
      console.warn('[User Active Skin GET] Sesión no encontrada para el token proporcionado');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado. Por favor, inicia sesión de nuevo en la página web.'
      });
    }

    // Verificar si la sesión ha expirado
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      console.warn('[User Active Skin GET] Sesión expirada:', {
        expiresAt: session.expiresAt,
        now: new Date()
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado. Por favor, inicia sesión de nuevo en la página web.'
      });
    }

    const activeSkinUrl = await getUserActiveSkin(session.userId);

    console.log('[User Active Skin GET] Skin activa obtenida:', {
      userId: session.userId,
      username: session.username,
      hasSkin: !!activeSkinUrl,
      skinType: activeSkinUrl ? (activeSkinUrl.startsWith('data:') ? 'base64' : 'URL') : 'none',
      skinPreview: activeSkinUrl ? activeSkinUrl.substring(0, 50) + '...' : 'none'
    });

    res.json({
      success: true,
      skinUrl: activeSkinUrl
    });
  } catch (error: any) {
    console.error('[User Active Skin GET] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener skin activa del usuario'
    });
  }
});

// API para actualizar la skin activa del usuario
app.put('/api/user/skin/active', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    console.log('[User Active Skin PUT] Token recibido:', {
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...',
      tokenEnd: '...' + accessToken.substring(accessToken.length - 10)
    });

    const { findSessionByAccessToken, setUserActiveSkin, getUserActiveSkin } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    console.log('[User Active Skin PUT] Sesión encontrada:', {
      hasSession: !!session,
      userId: session?.userId,
      username: session?.username,
      expiresAt: session?.expiresAt,
      isExpired: session?.expiresAt ? new Date(session.expiresAt) < new Date() : null
    });

    if (!session) {
      console.warn('[User Active Skin PUT] Sesión no encontrada para el token proporcionado');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado. Por favor, inicia sesión de nuevo en la página web.'
      });
    }

    // Verificar si la sesión ha expirado
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      console.warn('[User Active Skin PUT] Sesión expirada:', {
        expiresAt: session.expiresAt,
        now: new Date()
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado. Por favor, inicia sesión de nuevo en la página web.'
      });
    }

    const { skinUrl } = req.body;

    if (!skinUrl) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'URL de la skin es requerida.'
      });
    }

    console.log('[User Active Skin PUT] Actualizando skin activa:', {
      userId: session.userId,
      username: session.username,
      skinUrlType: skinUrl.startsWith('data:') ? 'base64' : 'URL',
      skinUrlLength: skinUrl.length,
      skinUrlPreview: skinUrl.substring(0, 50) + '...'
    });

    await setUserActiveSkin(session.userId, skinUrl);

    // Verificar que se guardó correctamente
    const savedSkin = await getUserActiveSkin(session.userId);
    console.log('[User Active Skin PUT] Skin guardada verificada:', {
      saved: !!savedSkin,
      savedType: savedSkin ? (savedSkin.startsWith('data:') ? 'base64' : 'URL') : 'none',
      savedPreview: savedSkin ? savedSkin.substring(0, 50) + '...' : 'none'
    });

    res.json({
      success: true,
      message: 'Skin activa actualizada correctamente.',
      skinUrl: skinUrl
    });
  } catch (error: any) {
    console.error('[User Active Skin PUT] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al actualizar skin activa del usuario'
    });
  }
});

// API para obtener las capas del usuario
app.get('/api/user/capes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, getUserCapes } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const capes = await getUserCapes(session.userId);

    res.json({
      success: true,
      capes: capes.map(cape => ({
        id: cape.id,
        name: cape.name,
        url: cape.url,
        uploadedAt: cape.uploadedAt
      }))
    });
  } catch (error: any) {
    console.error('[User Capes] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener capas del usuario'
    });
  }
});

// API para subir una capa
app.post('/api/user/capes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, addUserCape } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'Nombre y URL de la capa son requeridos.'
      });
    }

    const newCape = await addUserCape(session.userId, name, url);

    res.json({
      success: true,
      cape: {
        id: newCape.id,
        name: newCape.name,
        url: newCape.url,
        uploadedAt: newCape.uploadedAt
      }
    });
  } catch (error: any) {
    console.error('[Upload Cape] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al subir la capa'
    });
  }
});

// API para eliminar una capa
app.delete('/api/user/capes/:capeId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { capeId } = req.params;
    const { findSessionByAccessToken, deleteUserCape } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const success = await deleteUserCape(session.userId, capeId);

    if (success) {
      res.json({
        success: true,
        message: 'Capa eliminada exitosamente.'
      });
    } else {
      res.status(404).json({
        error: 'NotFound',
        message: 'Capa no encontrada.'
      });
    }
  } catch (error: any) {
    console.error('[Delete Cape] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al eliminar la capa'
    });
  }
});

// API para obtener la capa activa del usuario
app.get('/api/user/cape/active', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, getUserActiveCape } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const activeCapeUrl = await getUserActiveCape(session.userId);

    res.json({
      success: true,
      capeUrl: activeCapeUrl
    });
  } catch (error: any) {
    console.error('[User Active Cape GET] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener capa activa del usuario'
    });
  }
});

// API para actualizar la capa activa del usuario
app.put('/api/user/cape/active', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, setUserActiveCape } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const { capeUrl } = req.body;

    if (!capeUrl) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'URL de la capa es requerida.'
      });
    }

    await setUserActiveCape(session.userId, capeUrl);

    res.json({
      success: true,
      message: 'Capa activa actualizada correctamente.',
      capeUrl: capeUrl
    });
  } catch (error: any) {
    console.error('[User Active Cape PUT] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al actualizar capa activa del usuario'
    });
  }
});

// API para obtener información del usuario para el launcher
app.get('/api/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { findSessionByAccessToken, findUserById, getUserActiveSkin, getUserActiveCape, getUserProfiles } = await import('./database/memoryStore');

    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Usuario no encontrado.'
      });
    }

    const profiles = await getUserProfiles(session.userId);
    const activeSkin = await getUserActiveSkin(session.userId);
    const activeCape = await getUserActiveCape(session.userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        skinUrl: activeSkin || null,
        capeUrl: activeCape || null,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      profiles: profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        skinUrl: profile.skinUrl || activeSkin || null,
        capeUrl: profile.capeUrl || activeCape || null,
        createdAt: profile.createdAt
      }))
    });
  } catch (error: any) {
    console.error('[User Profile API] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener información del usuario'
    });
  }
});

// Endpoint para que el launcher obtenga información de usuario por UUID (Yggdrasil protocol)
app.get('/api/user/profile/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    const { findUserById, getUserActiveSkin, getUserActiveCape, getUserProfiles } = await import('./database/memoryStore');

    const user = await findUserById(uuid);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Usuario no encontrado.'
      });
    }

    const profiles = await getUserProfiles(uuid);
    const activeSkin = await getUserActiveSkin(uuid);
    const activeCape = await getUserActiveCape(uuid);

    res.json({
      id: user.id,
      name: user.username,
      skins: activeSkin ? [{ url: activeSkin }] : [],
      capes: activeCape ? [{ url: activeCape }] : [],
      profiles: profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        skins: profile.skinUrl ? [{ url: profile.skinUrl }] : [],
        capes: profile.capeUrl ? [{ url: profile.capeUrl }] : []
      }))
    });
  } catch (error: any) {
    console.error('[User Profile by UUID API] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener información del usuario'
    });
  }
});

// API para cerrar sesión
app.post('/api/user/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { deleteSession } = await import('./database/memoryStore');
    
    // Eliminar la sesión del servidor
    await deleteSession(accessToken);

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente.'
    });
  } catch (error: any) {
    console.error('[Logout] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al cerrar sesión'
    });
  }
});

// API para cambiar contraseña
app.post('/api/user/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso requerido.'
      });
    }

    const accessToken = authHeader.substring(7);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'MissingFields',
        message: 'Contraseña actual y nueva contraseña son requeridas.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'InvalidPassword',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.'
      });
    }

    const { findSessionByAccessToken, findUserById, verifyPassword, updateUserPassword } = await import('./database/memoryStore');
    const session = await findSessionByAccessToken(accessToken);
    
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado.'
      });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Usuario no encontrado.'
      });
    }

    // Verificar contraseña actual
    const isValid = await verifyPassword(user, currentPassword);
    if (!isValid) {
      return res.status(403).json({
        error: 'InvalidPassword',
        message: 'La contraseña actual es incorrecta.'
      });
    }

    // Actualizar contraseña
    const bcrypt = require('bcrypt');
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, newPasswordHash);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente.'
    });
  } catch (error: any) {
    console.error('[Change Password] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al cambiar la contraseña'
    });
  }
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'InternalServerError',
    errorMessage: err.message || 'An internal server error occurred.',
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log('[Database] Base de datos inicializada');

    // Limpiar sesiones expiradas cada hora
    setInterval(async () => {
      await cleanupExpiredSessions();
      console.log('[Database] Sesiones expiradas limpiadas');
    }, 3600000); // 1 hora

    // Iniciar servidor
    app.listen(PORT, () => {
      const baseUrl = `http://localhost:${PORT}`;
      console.log(`[Server] Servidor de autenticación DRK Launcher iniciado`);
      console.log(`[Server] Escuchando en puerto ${PORT}`);
      console.log(`[Server] URL base: ${baseUrl}`);
      console.log(`[Server] ==========================================`);
      console.log(`[Server] RUTAS DISPONIBLES:`);
      console.log(`[Server] ==========================================`);
      console.log(`[Server] GET  ${baseUrl}/              -> landing.html (Página de inicio)`);
      console.log(`[Server] GET  ${baseUrl}/login.html    -> index.html (Login/Registro)`);
      console.log(`[Server] GET  ${baseUrl}/home.html     -> home.html (Dashboard)`);
      console.log(`[Server] GET  ${baseUrl}/health        -> Health check`);
      console.log(`[Server] POST ${baseUrl}/authserver/authenticate -> Autenticación`);
      console.log(`[Server] POST ${baseUrl}/api/register  -> Registro de usuario`);
      console.log(`[Server] GET  ${baseUrl}/api/user/info -> Información del usuario`);
      console.log(`[Server] POST ${baseUrl}/api/user/change-password -> Cambiar contraseña`);
      console.log(`[Server] ==========================================`);
      console.log(`[Server] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

