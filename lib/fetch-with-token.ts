export async function fetchWithToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const res = await fetch('/api/auth/token')
  const { token } = await res.json()
  return fn(token)
}
