const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const orgId = "67968cd99211bcf9ebe0614a";

async function updateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update user with single organization
    const result = await User.updateMany(
      { organizationId: { $exists: false } },
      {
        $set: {
          organizationId: orgId,
          role: "admin"
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log("Update completed successfully");
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

updateUser();
