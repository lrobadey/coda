"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";

function getAuthData(formData) {
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };
}

export async function login(formData) {
  const supabase = await createClient();
  const { email, password } = getAuthData(formData);

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData) {
  const supabase = await createClient();
  const { email, password } = getAuthData(formData);

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}
