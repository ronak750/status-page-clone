const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Service = require("../models/Service");
const Incident = require("../models/Incident");

const orgId = "67968cd99211bcf9ebe0614a";

async function updateRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update all services
    const serviceResult = await Service.updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: orgId } }
    );
    console.log(`Updated ${serviceResult.modifiedCount} services`);

    // Update all incidents
    const incidentResult = await Incident.updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: orgId } }
    );
    console.log(`Updated ${incidentResult.modifiedCount} incidents`);

    console.log("Update completed successfully");
  } catch (error) {
    console.error("Error updating records:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

updateRecords();
