import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}
