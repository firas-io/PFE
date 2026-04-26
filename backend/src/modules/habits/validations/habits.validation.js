export const createHabitSchema = {
  body: {
    type: "object",
    properties: {
      nom: { type: "string" }, titre: { type: "string" },
      description: { type: "string" }, categorie: { type: "string" },
      priorite: { type: "string" }, frequence: { type: "string" }, statut: { type: "string" }
    },
    additionalProperties: true
  },
};

export const updateHabitStatusSchema = {
  body: {
    type: "object",
    properties: { statut: { type: "string" }, status: { type: "string" } },
    additionalProperties: true
  },
};
