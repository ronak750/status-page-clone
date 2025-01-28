const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Incident = require("../models/Incident");
const Organization = require("../models/Organization");

// Helper function to get UTC date string
function getUTCDateString(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// Helper function to format date in UK format
function formatDateUK(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    timeZone: "UTC",
  });
}

// Middleware to ensure status history is up to date
const ensureStatusHistory = async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find all services that don't have today's status
    const services = await Service.find({ organizationId: req.params.orgId });

    for (const service of services) {
      const todayHistory = service.statusHistory.find((history) => {
        const historyDate = new Date(history.date);
        historyDate.setUTCHours(0, 0, 0, 0);
        return historyDate.getTime() === today.getTime();
      });

      if (!todayHistory) {
        // Add today's status entry with the current service status
        service.statusHistory.push({
          date: today,
          statuses: [
            {
              value: "operational", // Use current status or default to operational
              timestamp: new Date().toISOString(),
            },
          ],
        });
        await service.save();
      }
    }
    next();
  } catch (error) {
    console.error("Error updating status history:", error);
    next(); // Continue even if there's an error
  }
};

// Get organization's public status page data
router.get("/status/:orgId", ensureStatusHistory, async (req, res) => {
  try {
    const { orgId } = req.params;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Get all services for the organization with their incidents
    const services = await Service.find({ organizationId: orgId });
    const servicesWithData = await Promise.all(
      services.map(async (service) => {
        const incidents = await Incident.find({ service: service._id }).sort({ createdAt: -1 });
        return {
          ...service.toObject({ virtuals: true }),
          incidents,
          statusHistory: service.statusHistory,
          dailyWorstStatuses: service.dailyWorstStatuses,
        };
      })
    );

    // Get all incidents for the organization, sorted by date
    const incidents = await Incident.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .populate("service", "name");

    // Group incidents by date
    const groupedIncidents = {};
    incidents.forEach((incident) => {
      const date = new Date(incident.createdAt).toLocaleDateString("en-GB");
      if (!groupedIncidents[date]) {
        groupedIncidents[date] = [];
      }
      groupedIncidents[date].push(incident);
    });

    res.json({
      organization: {
        name: organization.name,
      },
      services: servicesWithData,
      incidents: groupedIncidents,
    });
  } catch (err) {
    console.error("Error fetching public status:", err);
    res.status(500).json({ message: "Error fetching public status" });
  }
});

module.exports = router;
