export const createRoleSchema = {
  body: {
    type: "object",
    required: ["nom"],
    properties: {
      nom:         { type: "string", minLength: 2, maxLength: 50 },
      description: { type: "string", maxLength: 200 },
      permissions: { type: "array", items: { type: "string" }, default: [] },
    },
    additionalProperties: false,
  },
};

export const updateRoleSchema = {
  body: {
    type: "object",
    properties: {
      nom:         { type: "string", minLength: 2, maxLength: 50 },
      description: { type: "string", maxLength: 200 },
    },
    additionalProperties: false,
  },
};

export const updatePermissionsSchema = {
  body: {
    type: "object",
    required: ["permissions"],
    properties: {
      permissions: { type: "array", items: { type: "string" }, minItems: 0 },
    },
    additionalProperties: false,
  },
};
