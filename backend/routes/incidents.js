const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");
const User = require("../models/User");
const Service = require("../models/Service");
const getOrganization = require("../middleware/getOrganization");
const websocket = require("../websocket");

// Apply organization middleware to all routes
router.use(getOrganization);

// Get all incidents for organization
router.get("/", async (req, res) => {
  try {
    const incidents = await Incident.find({ organizationId: req.organizationId })
      .populate("services")
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ message: "Error fetching incidents" });
  }
});

// Create a new incident
router.post("/", async (req, res) => {
  try {
    const { title, description, status, service: serviceId, clerkId } = req.body;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const newIncident = new Incident({
      title,
      description,
      status,
      service: serviceId,
      organizationId: user.organizationId,
      updates: [
        {
          description: description,
          status,
          timestamp: new Date().toISOString(), // Store as UTC ISO string
        },
      ],
    });

    const savedIncident = await newIncident.save();

    // Populate service details
    const populatedIncident = await Incident.findById(savedIncident._id).populate("service", "name");

    console.log("Incident : ", populatedIncident);
    console.log("Organization ID:", user.organizationId);
    
    // Emit WebSocket event
    websocket.emitOrgUpdate(user.organizationId, "incidentUpdate", {
      type: "create",
      incident: populatedIncident,
    });
    console.log("WebSocket event emitted");

    res.status(201).json(populatedIncident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update incident status
router.patch("/:id", async (req, res) => {
  try {
    const { description, status, clerkId } = req.body;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Add update to incident history
    incident.updates.push({
      description: description || `Status changed to ${status}`,
      status,
      timestamp: new Date().toISOString(), // Store as UTC ISO string
    });

    // Update current status
    incident.status = status;
    await incident.save();

    const populatedIncident = await incident.populate("service", "name");

    // Emit WebSocket event
    websocket.emitOrgUpdate(user.organizationId, "incidentUpdate", {
      type: "update",
      incident: populatedIncident,
    });

    res.json(populatedIncident);
  } catch (err) {
    console.error("Error updating incident:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add update to incident
router.post("/:id/updates", async (req, res) => {
  try {
    const { description, status } = req.body;
    const incident = await Incident.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    incident.status = status;
    incident.updates.push({
      description,
      status,
      timestamp: new Date().toISOString(), // Store as UTC ISO string
    });

    const updatedIncident = await incident.save();
    const populatedIncident = await updatedIncident.populate("service", "name");

    // Emit WebSocket event
    websocket.emitOrgUpdate(req.organizationId, "incidentUpdate", {
      type: "update",
      incident: populatedIncident,
    });

    res.json(populatedIncident);
  } catch (error) {
    console.error("Error adding incident update:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete incident
router.delete("/:id", async (req, res) => {
  try {
    const incident = await Incident.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    }).populate("service", "name");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Emit WebSocket event
    websocket.emitOrgUpdate(req.organizationId, "incidentUpdate", {
      type: "delete",
      incident: incident,
    });

    res.json({ message: "Incident deleted successfully" });
  } catch (error) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
