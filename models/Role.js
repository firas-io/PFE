const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, unique: true }, // ex : "admin", "moderateur", "utilisateur"
        description: { type: String },
        permissions: [{ type: String }], // ex : ["USERS_VIEW", "USERS_EDIT", "HABITS_ADMIN", "ALL"]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
