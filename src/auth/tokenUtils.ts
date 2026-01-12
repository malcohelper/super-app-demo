/**
 * Token generation utilities for dummy authentication
 * 
 * WARNING: This is for DEMO purposes only!
 * Production apps should use real JWT from backend.
 */

import base64 from 'react-native-base64';

export interface TokenPayload {
  sub: string;      // User ID
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
  iat: number;      // Issued at
  exp: number;      // Expiration
}

/**
 * Generate a dummy bearer token
 * Format: Bearer {base64_encoded_payload}
 */
export function generateDummyToken(
  userId: string,
  email: string,
  name: string,
  role: 'admin' | 'user' | 'guest' = 'user',
  permissions: string[] = []
): string {
  const payload: TokenPayload = {
    sub: userId,
    email,
    name,
    role,
    permissions,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Encode payload as base64
  const encodedPayload = base64.encode(JSON.stringify(payload));
  
  return `Bearer.${encodedPayload}`;
}

/**
 * Decode a dummy token to get payload
 */
export function decodeDummyToken(token: string): TokenPayload | null {
  try {
    // Remove "Bearer." prefix
    const encodedPayload = token.replace('Bearer.', '');
    const decoded = base64.decode(encodedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeDummyToken(token);
  if (!payload) return true;
  
  return Date.now() > payload.exp;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
