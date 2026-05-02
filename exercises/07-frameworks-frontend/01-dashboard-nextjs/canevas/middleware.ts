import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TODO 9 : si la requête cible /dashboard*, vérifier la présence du cookie 'session'
  // Si absent, rediriger vers /login
  // Indice : request.cookies.get('session')

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
