import { EncryptJWT, jwtDecrypt } from 'jose'
import { cookies } from 'next/headers'
import { GitHub } from 'arctic'

export interface SessionPayload {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: {
    id: number
    login: string
    name: string | null
    avatarUrl: string
  }
}

export type Session = SessionPayload

const COOKIE_NAME = 'session'
const encoder = new TextEncoder()

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  // Hash to get a 256-bit key for A256GCM
  return encoder.encode(secret.padEnd(32, '0').slice(0, 32))
}

export async function encryptToken(payload: SessionPayload): Promise<string> {
  const key = getKey()
  return new EncryptJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .encrypt(key)
}

export async function decryptToken(token: string): Promise<SessionPayload> {
  const key = getKey()
  const { payload } = await jwtDecrypt(token, key)
  return payload as unknown as SessionPayload
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie?.value) return null

  try {
    return await decryptToken(cookie.value)
  } catch {
    return null
  }
}

export async function setSession(session: SessionPayload): Promise<void> {
  const encrypted = await encryptToken(session)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export function clearSession(): void {
  // cookies().delete() is synchronous in route handlers
  // but we need to handle the async cookies() call
  cookies().then((c) => c.delete(COOKIE_NAME))
}

export async function clearSessionAsync(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

function getGitHub(): GitHub {
  return new GitHub(
    process.env.GITHUB_APP_CLIENT_ID!,
    process.env.GITHUB_APP_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  )
}

export async function refreshSessionIfNeeded(session: Session): Promise<Session> {
  const now = Math.floor(Date.now() / 1000)
  if (session.expiresAt > now) return session

  const github = getGitHub()
  const tokens = await github.refreshAccessToken(session.refreshToken)

  const refreshed: SessionPayload = {
    accessToken: tokens.accessToken(),
    refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : session.refreshToken,
    expiresAt: Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000),
    user: session.user,
  }

  await setSession(refreshed)
  return refreshed
}

export { getGitHub }
