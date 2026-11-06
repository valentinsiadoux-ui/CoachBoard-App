import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = await createSupabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/connexion", request.nextUrl.origin), { status: 303 });
}
