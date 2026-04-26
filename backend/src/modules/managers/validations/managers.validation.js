export const createManagerSchema = {
  body: {
    type: "object",
    required: ["nom", "prenom", "email", "mot_de_passe"],
    properties: {
      nom:          { type: "string" },
      prenom:       { type: "string" },
      email:        { type: "string" },
      mot_de_passe: { type: "string" },
      departement:  { type: "string" },
    },
    additionalProperties: true,
  },
};

export const updateManagerSchema = {
  body: {
    type: "object",
    properties: {
      nom:         { type: "string" },
      prenom:      { type: "string" },
      email:       { type: "string" },
      departement: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const createManagerUserSchema = {
  body: {
    type: "object",
    required: ["nom", "prenom", "email", "mot_de_passe"],
    properties: {
      nom:          { type: "string" },
      prenom:       { type: "string" },
      email:        { type: "string" },
      mot_de_passe: { type: "string" },
      departement:  { type: "string" },
    },
    additionalProperties: true,
  },
};

export const updateManagerUserSchema = {
  body: {
    type: "object",
    properties: {
      nom:         { type: "string" },
      prenom:      { type: "string" },
      email:       { type: "string" },
      departement: { type: "string" },
      isActive:    { type: "boolean" },
    },
    additionalProperties: false,
  },
};
