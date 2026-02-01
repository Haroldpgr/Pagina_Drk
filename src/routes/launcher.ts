import express from 'express';
import { findUserByEmailOrUsername, findSessionByAccessToken, getUserActiveSkin, getUserActiveCape, getUserProfiles } from '../database/memoryStore';

const router = express.Router();

// Endpoint para que el launcher obtenga la información del perfil de usuario
router.get('/user/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Buscar usuario por nombre de usuario
    const user = await findUserByEmailOrUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'UserNotFound',
        message: 'Usuario no encontrado.'
      });
    }

    // Obtener perfiles del usuario
    const profiles = await getUserProfiles(user.id);
    
    // Obtener skin y capa activas
    const activeSkin = await getUserActiveSkin(user.id);
    const activeCape = await getUserActiveCape(user.id);

    // Enviar respuesta con la información del usuario
    res.json({
      id: user.id,
      username: user.username,
      name: user.username, // Para compatibilidad con el protocolo Yggdrasil
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
    console.error('[User Profile API] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al obtener el perfil del usuario'
    });
  }
});

// Endpoint para que el launcher valide la sesión (Yggdrasil auth)
router.post('/sessionserver/session/minecraft/join', async (req, res) => {
  try {
    const { accessToken, selectedProfile, serverId } = req.body;
    
    // Validar que tengamos los parámetros necesarios
    if (!accessToken || !selectedProfile || !serverId) {
      return res.status(400).json({
        error: 'MissingParameters',
        message: 'Parámetros requeridos: accessToken, selectedProfile, serverId'
      });
    }

    // Buscar sesión por accessToken
    const session = await findSessionByAccessToken(accessToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acceso inválido o expirado.'
      });
    }

    // Verificar que el perfil seleccionado pertenece al usuario
    const profiles = await getUserProfiles(session.userId);
    const profileExists = profiles.some(profile => profile.id === selectedProfile);
    
    if (!profileExists) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Perfil no pertenece al usuario.'
      });
    }

    // Enviar respuesta exitosa (sin contenido)
    res.status(204).send();
  } catch (error: any) {
    console.error('[Session Join API] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al procesar la unión al servidor'
    });
  }
});

// Endpoint para que el launcher obtenga el nombre del jugador por UUID (Yggdrasil auth)
router.get('/sessionserver/session/minecraft/hasJoined', async (req, res) => {
  try {
    const { username, serverId } = req.query;
    
    // Validar que tengamos los parámetros necesarios
    if (!username || !serverId) {
      return res.status(400).json({
        error: 'MissingParameters',
        message: 'Parámetros requeridos: username, serverId'
      });
    }

    // Buscar usuario por nombre de usuario
    const user = await findUserByEmailOrUsername(username as string);
    if (!user) {
      return res.status(204).send(); // No encontrado, pero sin error
    }

    // Obtener perfiles del usuario
    const profiles = await getUserProfiles(user.id);
    
    // Obtener skin y capa activas
    const activeSkin = await getUserActiveSkin(user.id);
    const activeCape = await getUserActiveCape(user.id);

    // Enviar respuesta con la información del usuario
    res.json({
      id: user.id,
      name: user.username,
      skins: activeSkin ? [{ url: activeSkin }] : [],
      capes: activeCape ? [{ url: activeCape }] : []
    });
  } catch (error: any) {
    console.error('[Has Joined API] Error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Error al verificar la unión al servidor'
    });
  }
});

export default router;