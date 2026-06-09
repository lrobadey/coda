const OPPORTUNITY_COLUMNS = "id,user_id,title,org,deadline,stage,source_url,notes,created_at,updated_at";

export const VALID_STAGES = ["found", "interested", "in_progress", "submitted", "response"];

function cleanOpportunityPayload(input = {}) {
  return {
    title: String(input.title || "").trim(),
    org: input.org ? String(input.org).trim() : null,
    deadline: input.deadline || null,
    stage: VALID_STAGES.includes(input.stage) ? input.stage : "found",
    source_url: input.source_url ? String(input.source_url).trim() : null,
    notes: input.notes ? String(input.notes).trim() : null,
  };
}

export async function listOpportunities(supabase) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createOpportunity(supabase, userId, input) {
  const payload = cleanOpportunityPayload(input);
  if (!payload.title) throw new Error("Opportunity title is required.");

  const { data, error } = await supabase
    .from("opportunities")
    .insert({ ...payload, user_id: userId })
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOpportunity(supabase, userId, id, input) {
  const payload = cleanOpportunityPayload(input);
  if (!payload.title) delete payload.title;

  const { data, error } = await supabase
    .from("opportunities")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function moveOpportunity(supabase, userId, id, stage) {
  if (!VALID_STAGES.includes(stage)) throw new Error("Invalid stage.");

  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select(OPPORTUNITY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOpportunity(supabase, userId, id) {
  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return { id, deleted: true };
}
