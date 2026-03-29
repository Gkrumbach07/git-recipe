import { EncryptJWT, jwtDecrypt } from 'jose'
import { createHash, randomBytes } from 'crypto'

const encoder = new TextEncoder()

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return encoder.encode(secret.padEnd(32, '0').slice(0, 32))
}

/**
 * Create an encrypted auth code containing GitHub token + PKCE code_challenge.
 * Expires in 5 minutes.
 */
export async function createAuthCode(
  githubToken: string,
  codeChallenge: string,
  redirectUri: string,
  clientId: string,
): Promise<string> {
  const key = getKey()
  return new EncryptJWT({
    githubToken,
    codeChallenge,
    redirectUri,
    clientId,
    type: 'auth_code',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .encrypt(key)
}

/**
 * Decrypt and validate an auth code.
 */
export async function verifyAuthCode(code: string): Promise<{
  githubToken: string
  codeChallenge: string
  redirectUri: string
  clientId: string
}> {
  const key = getKey()
  const { payload } = await jwtDecrypt(code, key)
  if (payload.type !== 'auth_code') {
    throw new Error('Invalid token type')
  }
  return {
    githubToken: payload.githubToken as string,
    codeChallenge: payload.codeChallenge as string,
    redirectUri: payload.redirectUri as string,
    clientId: payload.clientId as string,
  }
}

/**
 * Create an access token (encrypted GitHub token). Expires in 8 hours.
 */
export async function createAccessToken(githubToken: string): Promise<string> {
  const key = getKey()
  return new EncryptJWT({
    githubToken,
    type: 'access_token',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .encrypt(key)
}

/**
 * Decrypt access token and return AuthInfo-compatible object.
 */
export async function verifyAccessToken(token: string): Promise<{
  token: string
  clientId: string
  scopes: string[]
  extra: { githubToken: string }
}> {
  const key = getKey()
  const { payload } = await jwtDecrypt(token, key)
  if (payload.type !== 'access_token') {
    throw new Error('Invalid token type')
  }
  return {
    token,
    clientId: 'mcp-client',
    scopes: ['repo', 'read:user'],
    extra: { githubToken: payload.githubToken as string },
  }
}

/**
 * Create a client_id JWT from registration data.
 * The client_secret is embedded so we can verify without a database.
 */
export async function createClientId(
  clientName: string,
  redirectUris: string[],
  clientSecret: string,
): Promise<string> {
  const key = getKey()
  return new EncryptJWT({
    clientName,
    redirectUris,
    clientSecret,
    type: 'client_id',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .encrypt(key)
}

/**
 * Verify client_id JWT.
 */
export async function verifyClientId(clientId: string): Promise<{
  clientName: string
  redirectUris: string[]
  clientSecret: string
}> {
  const key = getKey()
  const { payload } = await jwtDecrypt(clientId, key)
  if (payload.type !== 'client_id') {
    throw new Error('Invalid token type')
  }
  return {
    clientName: payload.clientName as string,
    redirectUris: payload.redirectUris as string[],
    clientSecret: payload.clientSecret as string,
  }
}

/**
 * Validate PKCE code_verifier against code_challenge (S256).
 */
export function validatePkce(codeVerifier: string, codeChallenge: string): boolean {
  const hash = createHash('sha256').update(codeVerifier).digest()
  const computed = Buffer.from(hash).toString('base64url')
  return computed === codeChallenge
}

/**
 * Generate a cryptographically secure random string.
 */
export function generateSecret(length = 32): string {
  return randomBytes(length).toString('base64url')
}

/**
 * Encrypt OAuth params into a cookie value.
 */
export async function encryptOAuthParams(params: {
  redirectUri: string
  state: string
  codeChallenge: string
  clientId: string
}): Promise<string> {
  const key = getKey()
  return new EncryptJWT({
    ...params,
    type: 'oauth_params',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .encrypt(key)
}

/**
 * Decrypt OAuth params from cookie value.
 */
export async function decryptOAuthParams(token: string): Promise<{
  redirectUri: string
  state: string
  codeChallenge: string
  clientId: string
}> {
  const key = getKey()
  const { payload } = await jwtDecrypt(token, key)
  if (payload.type !== 'oauth_params') {
    throw new Error('Invalid token type')
  }
  return {
    redirectUri: payload.redirectUri as string,
    state: payload.state as string,
    codeChallenge: payload.codeChallenge as string,
    clientId: payload.clientId as string,
  }
}
