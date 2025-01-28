const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    adminId: {
      type: String, // Clerk user ID
      required: true,
    },
    members: [{
      userId: String, // Clerk user ID
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", organizationSchema);
