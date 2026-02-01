/**
 * Rutas de autenticación para Drk Launcher
 * Implementa el protocolo Yggdrasil (Mojang Legacy Auth)
 */

import express, { Request, Response } from 'express';
import {
  AuthenticateRequest,
  AuthenticateResponse,
  RefreshRequest,
  RefreshResponse,
  ValidateRequest,
  ErrorResponse,
} from '../types/auth';
import {
  findUserByEmailOrUsername,
  verifyPassword,
  createSession,
  findSessionByAccessToken,
  findSessionByClientToken,
  deleteSession,
  getUserProfiles,
  findUserById,
} from '../database/memoryStore';
import { generateAccessToken, generateClientToken } from '../utils/crypto';

const router = express.Router();

/**
 * POST /authserver/authenticate
 * Autentica un usuario y devuelve tokens
 */
router.post('/authenticate', async (req: Request, res: Response) => {
  try {
    const body: AuthenticateRequest = req.body;

    // Validar campos requeridos
    if (!body.username || !body.password) {
      const error: ErrorResponse = {
        error: 'IllegalArgumentException',
        errorMessage: 'Credentials can not be null.',
      };
      return res.status(400).json(error);
    }

    // Validar agent
    if (!body.agent || body.agent.name !== 'Minecraft' || body.agent.version !== 1) {
      const error: ErrorResponse = {
        error: 'IllegalArgumentException',
        errorMessage: 'Invalid agent.',
      };
      return res.status(400).json(error);
    }

    // Buscar usuario
    const user = await findUserByEmailOrUsername(body.username);
    if (!user) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid credentials. Invalid username or password.',
      };
      return res.status(403).json(error);
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(user, body.password);
    if (!isValidPassword) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid credentials. Invalid username or password.',
      };
      return res.status(403).json(error);
    }

    // Generar tokens
    const accessToken = generateAccessToken();
    const clientToken = body.clientToken || generateClientToken();

    // Obtener perfiles del usuario
    const profiles = await getUserProfiles(user.id);
    
    if (profiles.length === 0) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'No profiles available for this user.',
      };
      return res.status(403).json(error);
    }

    // Usar el primer perfil como selectedProfile
    const selectedProfile = profiles[0];

    // Crear sesión
    const expiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '86400', 10);
    await createSession(user.id, user.username, accessToken, clientToken, expiresIn);

    // Construir respuesta
    const response: AuthenticateResponse = {
      accessToken,
      clientToken,
      selectedProfile: {
        id: selectedProfile.id,
        name: selectedProfile.name,
      },
      availableProfiles: profiles.map(p => ({
        id: p.id,
        name: p.name,
      })),
    };

    // Agregar información del usuario si se solicita
    if (body.requestUser) {
      response.user = {
        id: user.id,
        username: user.username,
        properties: [],
      };
    }

    // Actualizar último login
    user.lastLogin = new Date();

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[Auth] Error en authenticate:', error);
    const errorResponse: ErrorResponse = {
      error: 'InternalServerError',
      errorMessage: error.message || 'An internal server error occurred.',
    };
    return res.status(500).json(errorResponse);
  }
});

/**
 * POST /authserver/refresh
 * Refresca un token de acceso
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const body: RefreshRequest = req.body;

    // Validar campos requeridos
    if (!body.accessToken || !body.clientToken) {
      const error: ErrorResponse = {
        error: 'IllegalArgumentException',
        errorMessage: 'Access token and client token are required.',
      };
      return res.status(400).json(error);
    }

    // Buscar sesión
    const session = await findSessionByAccessToken(body.accessToken);
    if (!session) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid token.',
      };
      return res.status(403).json(error);
    }

    // Verificar que el clientToken coincida
    if (session.clientToken !== body.clientToken) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid token.',
      };
      return res.status(403).json(error);
    }

    // Verificar que la sesión no haya expirado
    if (session.expiresAt < new Date()) {
      await deleteSession(body.accessToken);
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Token expired.',
      };
      return res.status(403).json(error);
    }

    // Obtener usuario
    const user = await findUserById(session.userId);
    if (!user) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'User not found.',
      };
      return res.status(403).json(error);
    }

    // Obtener perfiles
    const profiles = await getUserProfiles(user.id);
    if (profiles.length === 0) {
      const error: ErrorResponse = {
        error: 'ForbiddenOperationException',
        errorMessage: 'No profiles available.',
      };
      return res.status(403).json(error);
    }

    // Determinar perfil seleccionado
    let selectedProfile = profiles[0];
    if (body.selectedProfile) {
      const requestedProfile = profiles.find(p => p.id === body.selectedProfile!.id);
      if (requestedProfile) {
        selectedProfile = requestedProfile;
      }
    }

    // Generar nuevo accessToken
    const newAccessToken = generateAccessToken();
    const expiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '86400', 10);

    // Eliminar sesión antigua y crear nueva
    await deleteSession(body.accessToken);
    await createSession(user.id, user.username, newAccessToken, body.clientToken, expiresIn);

    // Construir respuesta
    const response: RefreshResponse = {
      accessToken: newAccessToken,
      clientToken: body.clientToken,
      selectedProfile: {
        id: selectedProfile.id,
        name: selectedProfile.name,
      },
    };

    // Agregar información del usuario si se solicita
    if (body.requestUser) {
      response.user = {
        id: user.id,
        username: user.username,
        properties: [],
      };
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[Auth] Error en refresh:', error);
    const errorResponse: ErrorResponse = {
      error: 'InternalServerError',
      errorMessage: error.message || 'An internal server error occurred.',
    };
    return res.status(500).json(errorResponse);
  }
});

/**
 * POST /authserver/validate
 * Valida un token de acceso
 * Devuelve 204 No Content si es válido, 403 si no lo es
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const body: ValidateRequest = req.body;

    // Validar campos requeridos
    if (!body.accessToken) {
      return res.status(204).send(); // Según el protocolo, devuelve 204 incluso si falta el token
    }

    // Buscar sesión
    const session = await findSessionByAccessToken(body.accessToken);
    if (!session) {
      return res.status(403).json({
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid token.',
      });
    }

    // Verificar que la sesión no haya expirado
    if (session.expiresAt < new Date()) {
      await deleteSession(body.accessToken);
      return res.status(403).json({
        error: 'ForbiddenOperationException',
        errorMessage: 'Token expired.',
      });
    }

    // Si hay clientToken, verificar que coincida
    if (body.clientToken && session.clientToken !== body.clientToken) {
      return res.status(403).json({
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid token.',
      });
    }

    // Token válido
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Auth] Error en validate:', error);
    return res.status(403).json({
      error: 'InternalServerError',
      errorMessage: error.message || 'An internal server error occurred.',
    });
  }
});

export default router;

