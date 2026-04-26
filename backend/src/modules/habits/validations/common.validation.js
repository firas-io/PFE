export const commonSchemas = [
  {
    $id: "habitBody",
    type: "object",
    properties: {
      nom:           { type: "string" },
      titre:         { type: "string" },
      description:   { type: "string" },
      categorie:     { type: "string" },
      priorite:      { type: "string" },
      frequence:     { type: "string" },
      statut:        { type: "string" }
    }
  }
];
