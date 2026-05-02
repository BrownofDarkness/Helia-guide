import { sign as signHono, verify as verifyHono } from 'hono/jwt';
import { config } from '../config.js';

const TTL_SECONDS = 60 * 60 * 24;
const ALG = 'HS256' as const;

export interface JwtPayload {
  sub: string;
  exp: number;
}

export async function signToken(userId: number): Promise<string> {
  return signHono(
    {
      sub: String(userId),
      exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
    },
    config.JWT_SECRET,
    ALG
  );
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const payload = await verifyHono(token, config.JWT_SECRET, ALG);
  return payload as unknown as JwtPayload;
}

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = TTL_SECONDS;
