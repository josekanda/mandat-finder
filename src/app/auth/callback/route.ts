import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  const redirectTo = new URL(next, origin);

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(redirectTo);
      }
    }

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(redirectTo);
      }
    }
  } catch {
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_callback_failed");

  if (next) {
    loginUrl.searchParams.set("next", next);
  }

  return NextResponse.redirect(loginUrl);
}