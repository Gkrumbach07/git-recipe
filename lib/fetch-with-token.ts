export async function fetchWithToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const res = await fetch('/api/auth/token')
  if (!res.ok) {
    window.location.href = '/login'
    return new Promise(() => {})
  }
  const { token } = await res.json()
  return fn(token)
}
