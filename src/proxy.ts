import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      `<html>
        <head>
          <title>Configuração Incompleta - Agus Moto Conceito</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px border #27272a; padding: 2.5rem; border-radius: 1.5rem; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            h1 { color: #ef4444; font-size: 1.5rem; margin-top: 0; font-weight: 750; }
            p { font-size: 0.9rem; line-height: 1.5; color: #a1a1aa; }
            code { background: #27272a; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #f4f4f5; font-family: monospace; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Configuração Incompleta</h1>
            <p>As variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> ou <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> não foram configuradas no ambiente de produção.</p>
            <p>Por favor, configure-as nas configurações de variáveis de ambiente da sua hospedagem (ex: Vercel, Netlify, Render, etc.).</p>
          </div>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT retrieve user via supabase.auth.getSession() as it is insecure
  // and can be spoofed. Use supabase.auth.getUser() instead.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isLoginPath = url.pathname === "/login";

  if (!user && !isLoginPath) {
    // If not authenticated and not on login, redirect to /login
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPath) {
    // If authenticated and on login, redirect to home
    url.pathname = "/ordens-servico";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (app logo)
     * - favicon.png (app favicon)
     * - any other asset in public/
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
