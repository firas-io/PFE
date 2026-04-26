export const createLogSchema = {
  body: {
    type: "object",
    required: ["habit_id"],
    properties: {
      habit_id: { type: "string" }, date: { type: "string" },
      statut: { type: "string" },   notes: { type: "string" }, photo_url: { type: "string" }
    },
    additionalProperties: true
  },
};

export const catchupLogSchema = {
  body: {
    type: "object",
    required: ["habit_id", "date", "note"],
    properties: {
      habit_id:  { type: "string" },
      date:      { type: "string" },
      note:      { type: "string", minLength: 1 },
      photo_url: { type: "string" }
    },
    additionalProperties: true
  },
};
