import bcrypt from 'bcryptjs';
import { db } from './db';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_HOURS = 24;

// Simple in-memory session store (for production, use Redis or database)
const sessions = new Map<string, { userId: string; expiresAt: Date }>();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  sessions.set(token, { userId, expiresAt });
  
  return token;
}

export async function getSession(token: string): Promise<{ userId: string } | null> {
  const session = sessions.get(token);
  
  if (!session) return null;
  
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  
  return { userId: session.userId };
}

export async function deleteSession(token: string): Promise<void> {
  sessions.delete(token);
}

export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const session = await getSession(token);
  if (!session) return null;
  
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  
  if (!user || !user.isActive) return null;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const SESSION_COOKIE_NAME_EXPORT = SESSION_COOKIE_NAME;
