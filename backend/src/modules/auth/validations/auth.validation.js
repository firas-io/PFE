export const registerSchema = {
  body: {
    type: "object",
    required: ["nom", "prenom", "email", "mot_de_passe"],
    properties: {
      nom:          { type: "string", minLength: 1 },
      prenom:       { type: "string", minLength: 1 },
      email:        { type: "string", format: "email" },
      mot_de_passe: { type: "string", minLength: 6 }
    },
    additionalProperties: true
  }
};

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "mot_de_passe"],
    properties: {
      email:        { type: "string" },
      mot_de_passe: { type: "string" }
    },
    additionalProperties: true
  }
};

export const loginLdapSchema = {
  body: {
    type: "object",
    required: ["email", "mot_de_passe"],
    properties: {
      email:        { type: "string" },
      mot_de_passe: { type: "string" }
    },
    additionalProperties: true
  }
};

export const refreshSchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", minLength: 1 }
    },
    additionalProperties: false
  }
};

export const logoutSchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", minLength: 1 }
    },
    additionalProperties: false
  }
};
