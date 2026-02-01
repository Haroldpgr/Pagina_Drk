/**
 * Almacenamiento en memoria para desarrollo
 * En producción, reemplazar con una base de datos real (PostgreSQL, MongoDB, etc.)
 */

import bcrypt from 'bcrypt';
import { User, Session, Profile, Skin, Cape } from '../types/auth';
import { generateUserUUID, generateProfileUUID } from '../utils/crypto';

// Almacenamiento en memoria (simulado)
const users: Map<string, User> = new Map();
const sessions: Map<string, Session> = new Map();
const profiles: Map<string, Profile> = new Map();
const userProfiles: Map<string, string[]> = new Map(); // userId -> profileIds[]
const userSkins: Map<string, Skin[]> = new Map(); // userId -> skins[]
const userCapes: Map<string, Cape[]> = new Map(); // userId -> capes[]
const userActiveSkin: Map<string, string> = new Map(); // userId -> skinUrl (skin activa del usuario)
const userActiveCape: Map<string, string> = new Map(); // userId -> capeUrl (capa activa del usuario)

/**
 * Inicializa la base de datos con un usuario de prueba
 */
export async function initializeDatabase(): Promise<void> {
  // Usuario de prueba: admin / admin123
  const testUserId = generateUserUUID();
  const testProfileId = generateProfileUUID();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const testUser: User = {
    id: testUserId,
    username: 'admin',
    email: 'admin@drklauncher.com',
    passwordHash: hashedPassword,
    skinUrl: '/skins/default.png', // URL de skin por defecto
    capeUrl: '/capes/default.png', // URL de capa por defecto
    createdAt: new Date(),
    lastLogin: new Date(),
  };

  const testProfile: Profile = {
    id: testProfileId,
    userId: testUserId,
    name: 'AdminPlayer',
    skinUrl: '/skins/default.png', // URL de skin por defecto
    capeUrl: '/capes/default.png', // URL de capa por defecto
    createdAt: new Date(),
  };

  users.set(testUserId, testUser);
  profiles.set(testProfileId, testProfile);
  userProfiles.set(testUserId, [testProfileId]);

  console.log('[Database] Usuario de prueba creado:');
  console.log('  Usuario: admin');
  console.log('  Contraseña: admin123');
  console.log('  Profile: AdminPlayer');
  console.log('  Skin: /skins/default.png');
  console.log('  Cape: /capes/default.png');
}

/**
 * Busca un usuario por email o username
 */
export async function findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
  for (const user of users.values()) {
    if (user.email === emailOrUsername || user.username === emailOrUsername) {
      return user;
    }
  }
  return null;
}

/**
 * Busca un usuario por ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  return users.get(userId) || null;
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(username: string, email: string, password: string): Promise<User> {
  const userId = generateUserUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const user: User = {
    id: userId,
    username,
    email,
    passwordHash,
    skinUrl: '/skins/default.png', // URL de skin por defecto
    capeUrl: '/capes/default.png', // URL de capa por defecto
    createdAt: new Date(),
  };

  users.set(userId, user);
  return user;
}

/**
 * Verifica la contraseña de un usuario
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Crea una nueva sesión
 */
export async function createSession(
  userId: string,
  username: string,
  accessToken: string,
  clientToken: string,
  expiresIn: number = 86400
): Promise<Session> {
  const session: Session = {
    accessToken,
    clientToken,
    userId,
    username,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    createdAt: new Date(),
  };
  
  sessions.set(accessToken, session);
  return session;
}

/**
 * Busca una sesión por accessToken
 */
export async function findSessionByAccessToken(accessToken: string): Promise<Session | null> {
  return sessions.get(accessToken) || null;
}

/**
 * Busca una sesión por clientToken
 */
export async function findSessionByClientToken(clientToken: string): Promise<Session | null> {
  for (const session of sessions.values()) {
    if (session.clientToken === clientToken) {
      return session;
    }
  }
  return null;
}

/**
 * Elimina una sesión
 */
export async function deleteSession(accessToken: string): Promise<void> {
  sessions.delete(accessToken);
}

/**
 * Elimina todas las sesiones expiradas
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

/**
 * Obtiene los perfiles de un usuario
 */
export async function getUserProfiles(userId: string): Promise<Profile[]> {
  const profileIds = userProfiles.get(userId) || [];
  return profileIds.map(id => profiles.get(id)!).filter(Boolean);
}

/**
 * Crea un nuevo perfil para un usuario
 */
export async function createProfile(userId: string, profileName: string): Promise<Profile> {
  const profileId = generateProfileUUID();
  
  const profile: Profile = {
    id: profileId,
    userId,
    name: profileName,
    createdAt: new Date(),
  };
  
  profiles.set(profileId, profile);
  
  const userProfileIds = userProfiles.get(userId) || [];
  userProfileIds.push(profileId);
  userProfiles.set(userId, userProfileIds);
  
  return profile;
}

/**
 * Busca un perfil por ID
 */
export async function findProfileById(profileId: string): Promise<Profile | null> {
  return profiles.get(profileId) || null;
}

/**
 * Actualiza la contraseña de un usuario
 */
export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  const user = users.get(userId);
  if (user) {
    user.passwordHash = newPasswordHash;
    users.set(userId, user);
  }
}

/**
 * Obtiene las skins de un usuario
 */
export async function getUserSkins(userId: string): Promise<Skin[]> {
  return userSkins.get(userId) || [];
}

/**
 * Agrega una skin a un usuario
 */
export async function addUserSkin(userId: string, name: string, url: string): Promise<Skin> {
  const skins = userSkins.get(userId) || [];
  const skinId = `skin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newSkin: Skin = {
    id: skinId,
    userId,
    name,
    url,
    uploadedAt: new Date()
  };
  skins.push(newSkin);
  userSkins.set(userId, skins);
  return newSkin;
}

/**
 * Elimina una skin de un usuario
 */
export async function deleteUserSkin(userId: string, skinId: string): Promise<boolean> {
  const skins = userSkins.get(userId) || [];
  const filteredSkins = skins.filter(skin => skin.id !== skinId);
  if (filteredSkins.length < skins.length) {
    userSkins.set(userId, filteredSkins);
    // Si la skin eliminada era la activa, limpiar la skin activa
    const activeSkinUrl = userActiveSkin.get(userId);
    const deletedSkin = skins.find(s => s.id === skinId);
    if (deletedSkin && activeSkinUrl === deletedSkin.url) {
      userActiveSkin.delete(userId);
    }
    return true;
  }
  return false;
}

/**
 * Obtiene la skin activa de un usuario
 */
export async function getUserActiveSkin(userId: string): Promise<string | null> {
  return userActiveSkin.get(userId) || null;
}

/**
 * Establece la skin activa de un usuario
 */
export async function setUserActiveSkin(userId: string, skinUrl: string): Promise<boolean> {
  userActiveSkin.set(userId, skinUrl);
  return true;
}

/**
 * Obtiene las capas de un usuario
 */
export async function getUserCapes(userId: string): Promise<Cape[]> {
  return userCapes.get(userId) || [];
}

/**
 * Agrega una capa a un usuario
 */
export async function addUserCape(userId: string, name: string, url: string): Promise<Cape> {
  const capes = userCapes.get(userId) || [];
  const capeId = `cape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newCape: Cape = {
    id: capeId,
    userId,
    name,
    url,
    uploadedAt: new Date()
  };
  capes.push(newCape);
  userCapes.set(userId, capes);
  return newCape;
}

/**
 * Elimina una capa de un usuario
 */
export async function deleteUserCape(userId: string, capeId: string): Promise<boolean> {
  const capes = userCapes.get(userId) || [];
  const filteredCapes = capes.filter(cape => cape.id !== capeId);
  if (filteredCapes.length < capes.length) {
    userCapes.set(userId, filteredCapes);
    // Si la capa eliminada era la activa, limpiar la capa activa
    const activeCapeUrl = userActiveCape.get(userId);
    const deletedCape = capes.find(c => c.id === capeId);
    if (deletedCape && activeCapeUrl === deletedCape.url) {
      userActiveCape.delete(userId);
    }
    return true;
  }
  return false;
}

/**
 * Obtiene la capa activa de un usuario
 */
export async function getUserActiveCape(userId: string): Promise<string | null> {
  return userActiveCape.get(userId) || null;
}

/**
 * Establece la capa activa de un usuario
 */
export async function setUserActiveCape(userId: string, capeUrl: string): Promise<boolean> {
  userActiveCape.set(userId, capeUrl);
  return true;
}

/**
 * Actualiza la información de un usuario
 */
export async function updateUser(userId: string, updateData: Partial<User>): Promise<boolean> {
  const user = users.get(userId);
  if (!user) return false;

  // Actualizar solo los campos proporcionados
  Object.assign(user, updateData);
  users.set(userId, user);
  return true;
}

/**
 * Actualiza la información de un perfil
 */
export async function updateProfile(profileId: string, updateData: Partial<Profile>): Promise<boolean> {
  const profile = profiles.get(profileId);
  if (!profile) return false;

  // Actualizar solo los campos proporcionados
  Object.assign(profile, updateData);
  profiles.set(profileId, profile);
  return true;
}

