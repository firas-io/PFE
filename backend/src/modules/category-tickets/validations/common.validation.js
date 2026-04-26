export const createTicketSchema = {
  body: {
    type: "object",
    required: ["title"],
    properties: {
      title:                  { type: "string" },
      description:            { type: "string" },
      proposed_category_name: { type: "string" },
      scope:                  { type: "string", enum: ["personal", "team"] },
    },
    additionalProperties: true,
  },
};

export default function loadCommonSchemas(_app) {}
