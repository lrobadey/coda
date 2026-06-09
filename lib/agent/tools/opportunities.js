import { tool } from "@openai/agents";
import { z } from "zod";
import {
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  moveOpportunity,
  suggestOpportunity,
  updateOpportunity,
  VALID_STAGES,
} from "../../opportunities";

const stageSchema = z.enum(VALID_STAGES);

const opportunityInputSchema = z.object({
  title: z.string().describe("Opportunity title. Required when creating."),
  org: z.string().nullable().describe("Organization, company, school, or source name."),
  deadline: z.string().nullable().describe("Deadline as YYYY-MM-DD, or null if unknown."),
  stage: stageSchema.describe("Pipeline stage."),
  source_url: z.string().nullable().describe("Source URL, or null if unknown."),
  notes: z.string().nullable().describe("Notes, requirements, or useful context."),
});

export function createOpportunityTools({ supabase, userId }) {
  return [
    tool({
      name: "list_opportunities",
      description: "List the signed-in user's tracked opportunities. Use this before updating if the user names an opportunity instead of giving an id.",
      parameters: z.object({}),
      async execute() {
        return await listOpportunities(supabase);
      },
    }),

    tool({
      name: "create_opportunity",
      description: "Create a new tracked opportunity for the signed-in user.",
      parameters: opportunityInputSchema,
      async execute(input) {
        return await createOpportunity(supabase, userId, input);
      },
    }),

    tool({
      name: "suggest_opportunity",
      description: "Add an opportunity found on the web to the user's Discover queue for review. Use this for web_search findings instead of create_opportunity. Skips duplicates by source URL.",
      parameters: opportunityInputSchema,
      async execute(input) {
        return await suggestOpportunity(supabase, userId, input);
      },
    }),

    tool({
      name: "update_opportunity",
      description: "Update an existing opportunity by id. Use list_opportunities first if you need to find the id.",
      parameters: z.object({
        id: z.string().uuid().describe("Opportunity id."),
        title: z.string().nullable().describe("New title, or null to keep current title."),
        org: z.string().nullable().describe("New organization/source, or null if empty/unknown."),
        deadline: z.string().nullable().describe("New deadline as YYYY-MM-DD, or null if empty/unknown."),
        stage: stageSchema.describe("New pipeline stage."),
        source_url: z.string().nullable().describe("New source URL, or null if empty/unknown."),
        notes: z.string().nullable().describe("New notes, or null if empty/unknown."),
      }),
      async execute({ id, ...input }) {
        return await updateOpportunity(supabase, userId, id, input);
      },
    }),

    tool({
      name: "move_opportunity",
      description: "Move an existing opportunity to a different pipeline stage by id.",
      parameters: z.object({
        id: z.string().uuid().describe("Opportunity id."),
        stage: stageSchema.describe("Target pipeline stage."),
      }),
      async execute({ id, stage }) {
        return await moveOpportunity(supabase, userId, id, stage);
      },
    }),

    tool({
      name: "delete_opportunity",
      description: "Delete an opportunity by id. Only call this when the user explicitly asks to delete and has confirmed deletion.",
      parameters: z.object({
        id: z.string().uuid().describe("Opportunity id."),
        confirmed: z.boolean().describe("True only if the user explicitly confirmed deletion."),
      }),
      async execute({ id, confirmed }) {
        if (!confirmed) {
          return { needs_confirmation: true, message: "Ask the user to confirm before deleting this opportunity." };
        }
        return await deleteOpportunity(supabase, userId, id);
      },
    }),
  ];
}
