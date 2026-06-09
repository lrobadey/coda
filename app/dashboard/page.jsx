import { redirect } from "next/navigation";
import CodaApp from "./CodaApp";
import { createClient } from "../../utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("opportunities")
    .select("id,user_id,title,org,deadline,stage,source_url,notes,created_at,updated_at")
    .order("created_at", { ascending: true });

  const { data: artistProfile, error: profileError } = await supabase
    .from("artist_profiles")
    .select("id,user_id,full_name,discipline,birthdate,bio,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <CodaApp
      initialOpportunities={data || []}
      initialArtistProfile={artistProfile || null}
      initialError={error?.message || profileError?.message || ""}
      userId={user.id}
      userEmail={user.email || "Signed in"}
    />
  );
}
