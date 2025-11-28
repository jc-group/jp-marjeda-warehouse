import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { Database } from "@/infrastructure/supabase/types";

export async function updateSession(request: NextRequest) {
  console.log("[middleware] incoming path:", request.nextUrl.pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[middleware] missing env vars, redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...(options as CookieOptions) });
        });
      },
    },
  });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Debug: eliminar en producción
    console.log("[middleware] session:", session);

    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
      console.log("[middleware] no session, redirect ->", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err) {
    console.error("[middleware] getSession error:", err);
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
}
