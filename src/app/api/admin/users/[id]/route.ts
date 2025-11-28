import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { Database } from "@/infrastructure/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ensureAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    return { ok: false, error: "No autorizado" };
  }

  return { ok: true };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await ensureAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "No autenticado" ? 401 : 403 });
  }

  const userId = params.id;
  const body = await req.json().catch(() => ({}));

  const payload: {
    email?: string;
    password?: string;
    user_metadata?: Record<string, unknown>;
  } = {};
  if (body.email) payload.email = body.email;
  if (body.password) payload.password = body.password;
  if (body.meta) payload.user_metadata = body.meta;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, payload);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario", details: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ user: data.user }, { status: 200 });
}
