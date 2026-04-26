export const createUserSchema = {
  body: {
    type: "object",
    required: ["nom", "prenom", "email", "mot_de_passe"],
    properties: {
      nom: { type: "string" }, prenom: { type: "string" },
      email: { type: "string" }, mot_de_passe: { type: "string" }
    },
    additionalProperties: true
  },
};

export const updateUserRoleSchema = {
  body: {
    type: "object",
    required: ["role"],
    properties: { role: { type: "string" } },
    additionalProperties: false
  },
};

export const updateUserStatusSchema = {
  body: {
    type: "object",
    required: ["isActive"],
    properties: { isActive: { type: "boolean" } },
    additionalProperties: false
  },
};

export const adminCreateUserSchema = {
  body: {
    type: "object",
    required: ["nom", "prenom", "email", "mot_de_passe", "roleNom"],
    properties: {
      nom: { type: "string" }, prenom: { type: "string" },
      email: { type: "string" }, mot_de_passe: { type: "string" },
      roleNom: { type: "string" }, departement: { type: "string" }
    },
    additionalProperties: true
  },
};
