/**
 * Utilidades de criptografía para Drk Launcher Auth Server
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un token de acceso aleatorio
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera un clientToken único
 */
export function generateClientToken(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Genera un UUID válido para perfiles de Minecraft
 */
export function generateProfileUUID(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Genera un UUID válido para usuarios
 */
export function generateUserUUID(): string {
  return uuidv4();
}

/**
 * Valida formato de UUID (sin guiones)
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{32}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Formatea UUID agregando guiones
 */
export function formatUUID(uuid: string): string {
  if (uuid.length === 32) {
    return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20, 32)}`;
  }
  return uuid;
}

