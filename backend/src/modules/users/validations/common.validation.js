export const commonSchemas = [
  {
    $id: "userBody",
    type: "object",
    properties: {
      nom:          { type: "string" },
      prenom:       { type: "string" },
      email:        { type: "string" },
      mot_de_passe: { type: "string" },
      departement:  { type: "string" }
    }
  }
];
