import { NextRequest, NextResponse } from 'next/server'

const CORS_PATHS = ['/api/oauth/', '/api/mcp', '/.well-known/']

function isCorsPath(pathname: string) {
  return CORS_PATHS.some((p) => pathname.startsWith(p))
}

function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight and headers for OAuth/MCP routes
  if (isCorsPath(pathname)) {
    if (request.method === 'OPTIONS') {
      return setCorsHeaders(new NextResponse(null, { status: 204 }))
    }
    const response = NextResponse.next()
    return setCorsHeaders(response)
  }

  // Auth check for app routes
  const session = request.cookies.get('session')
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/cookbook/:path*', '/api/oauth/:path*', '/api/mcp/:path*', '/.well-known/:path*'],
}
