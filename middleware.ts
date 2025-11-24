import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware'; // *Necesitaremos este helper

export async function middleware(request: NextRequest) {
  // Esta función actualiza la cookie de sesión y protege rutas
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/',
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico (icono)
     * - /login (la página de entrada)
     * - /auth (rutas de autenticación)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth).*)',
  ],
};
