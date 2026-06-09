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

  return (
    <CodaApp
      initialOpportunities={data || []}
      initialError={error?.message || ""}
      userId={user.id}
      userEmail={user.email || "Signed in"}
    />
  );
}
