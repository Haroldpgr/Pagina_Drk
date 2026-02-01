/**
 * Rutas del Servicio de Sesiones de Drk Launcher
 * Implementa el endpoint de perfiles de Minecraft (skins, capes, etc.)
 */

import express, { Request, Response } from 'express';
import { findProfileById, findUserById } from '../database/memoryStore';
import { formatUUID } from '../utils/crypto';

const router = express.Router();

/**
 * GET /sessionserver/session/minecraft/profile/<UUID>
 * Obtiene el perfil de Minecraft con texturas (skins, capes)
 */
router.get('/session/minecraft/profile/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    // Validar formato UUID
    if (!uuid || uuid.length !== 32) {
      return res.status(400).json({
        error: 'IllegalArgumentException',
        errorMessage: 'Invalid UUID format.',
      });
    }

    // Buscar perfil
    const profile = await findProfileById(uuid);
    if (!profile) {
      return res.status(204).send(); // 204 No Content según el protocolo
    }

    // Obtener usuario
    const user = await findUserById(profile.userId);
    if (!user) {
      return res.status(204).send();
    }

    // Construir respuesta según el protocolo de sesiones de Minecraft
    // Formato: Base64 encoded JSON con propiedades
    const profileData = {
      id: formatUUID(profile.id),
      name: profile.name,
      properties: [
        {
          name: 'textures',
          value: Buffer.from(JSON.stringify({
            timestamp: Date.now(),
            profileId: formatUUID(profile.id),
            profileName: profile.name,
            textures: {
              SKIN: {
                url: `https://api.drklauncher.com/textures/skin/${profile.id}`, // URL de la skin
              },
              // CAPE: { url: '...' } // Opcional: capa
            },
          })).toString('base64'),
        },
      ],
    };

    return res.status(200).json(profileData);
  } catch (error: any) {
    console.error('[Sessions] Error en profile:', error);
    return res.status(500).json({
      error: 'InternalServerError',
      errorMessage: error.message || 'An internal server error occurred.',
    });
  }
});

export default router;

