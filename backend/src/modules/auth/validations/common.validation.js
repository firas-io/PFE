export const commonSchemas = [
  {
    $id: "authUserResponse",
    type: "object",
    properties: {
      _id:    { type: "string" },
      nom:    { type: "string" },
      prenom: { type: "string" },
      email:  { type: "string" },
      role:   { type: "string" }
    }
  }
];
