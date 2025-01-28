const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["investigating", "identified", "monitoring", "resolved"], default: "investigating" },
    updates: [
      {
        description: { type: String, required: true },
        status: { type: String, enum: ["investigating", "identified", "monitoring", "resolved"], required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Incident", IncidentSchema);
