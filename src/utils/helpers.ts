import { MafiaRole } from '../types';

/**
 * Generate a unique ID based on timestamp and random string
 * Example output: "lkj2x3z-abc4def" (timestamp in base36 + random string)
 */
export function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Check if the agent is a mafia member (Mafia or Don)
 */
export function isMafia(role: MafiaRole): boolean {
  return role === MafiaRole.Mafia || role === MafiaRole.Don;
}
