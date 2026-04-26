export const createRoleSchema = {
  body: {
    type: "object",
    required: ["nom"],
    properties: {
      nom:         { type: "string" },
      description: { type: "string" },
      permissions: { type: "array", items: { type: "string" } }
    },
    additionalProperties: true
  },
};

export const updateRoleSchema = {
  body: {
    type: "object",
    properties: {
      nom:         { type: "string" },
      description: { type: "string" },
      permissions: { type: "array", items: { type: "string" } }
    },
    additionalProperties: true
  },
};
