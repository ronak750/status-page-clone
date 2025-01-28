const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Incident = require("../models/Incident");
const User = require("../models/User");
const getOrganization = require("../middleware/getOrganization");
const websocket = require("../websocket");

// Apply organization middleware to all routes
router.use(getOrganization);

// Middleware to ensure status history is up to date
const ensureStatusHistory = async (req, res, next) => {
  try {
    var today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find all services that don't have today's status
    const services = await Service.find({ organizationId: req.organizationId });

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

// Apply the middleware to relevant routes
router.use(["/"], ensureStatusHistory);

// Get all services with their status history
router.get("/", async (req, res) => {
  try {
    const services = await Service.find({ organizationId: req.organizationId });

    const servicesWithIncidents = await Promise.all(
      services.map(async (service) => {
        const incidents = await Incident.find({ service: service._id }).sort({ createdAt: -1 });
        //console.log(incidents);

        // Get the daily worst statuses using the virtual
        const dailyWorstStatuses = service.dailyWorstStatuses;

        //console.log(service.statusHistory);
        return {
          ...service.toObject({ virtuals: true }),
          incidents,
          // Include both detailed and summarized status history
          statusHistory: service.statusHistory,
          dailyWorstStatuses,
        };
      })
    );
    //console.log(servicesWithIncidents);
    res.json(servicesWithIncidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new service
router.post("/", async (req, res) => {
  const { name, description } = req.body;

  // Create status history for past 89 days
  const statusHistory = [];
  var today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Set to UTC midnight

  // Add past 89 days with no data
  for (let i = 89; i >= 1; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i); // Use UTC date operations
    statusHistory.push({
      date,
      statuses: [], // Empty statuses array indicates no data
    });
  }

  // Add today's initial status
  statusHistory.push({
    date: today,
    statuses: [
      {
        value: "operational",
        timestamp: new Date().toISOString(), // Current time in UTC
      },
    ],
  });

  const service = new Service({
    name,
    description,
    organizationId: req.organizationId,
    status: "operational",
    statusHistory,
  });

  try {
    const newService = await service.save();

    // Emit WebSocket event
    websocket.emitOrgUpdate(req.organizationId, "serviceUpdate", {
      type: "create",
      service: {
        ...newService.toObject({ virtuals: true }),
        dailyWorstStatuses: newService.dailyWorstStatuses,
      },
    });

    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service details
router.patch("/:id", async (req, res) => {
  console.log("dc");
  try {
    const { name, description } = req.body;
    const service = await Service.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (name) service.name = name;
    if (description) service.description = description;

    const updatedService = await service.save();

    // Get complete service data with incidents
    const populatedService = await Service.findById(updatedService._id);
    const incidents = await Incident.find({ service: populatedService._id }).sort({ createdAt: -1 });

    const serviceData = {
      ...populatedService.toObject({ virtuals: true }),
      incidents,
      statusHistory: populatedService.statusHistory,
      dailyWorstStatuses: populatedService.dailyWorstStatuses,
    };

    // Emit WebSocket event
    websocket.emitOrgUpdate(req.organizationId, "serviceUpdate", {
      type: "update",
      service: serviceData,
    });

    res.json(serviceData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update service status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const service = await Service.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.status = status;

    // Update status history using UTC
    var today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayHistory = service.statusHistory.find((history) => {
      const historyDate = new Date(history.date);
      historyDate.setUTCHours(0, 0, 0, 0);
      return historyDate.getTime() === today.getTime();
    });

    if (todayHistory) {
      todayHistory.statuses.push({
        value: status,
        timestamp: new Date().toISOString(), // Store as UTC ISO string
      });
    } else {
      service.statusHistory.push({
        date: today,
        statuses: [
          {
            value: status,
            timestamp: new Date().toISOString(), // Store as UTC ISO string
          },
        ],
      });
    }

    const updatedService = await service.save();

    // Get complete service data with incidents
    const populatedService = await Service.findById(updatedService._id);
    const incidents = await Incident.find({ service: populatedService._id }).sort({ createdAt: -1 });

    // Process status history for the last 90 days
    today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - 89);

    // Create a map of dates to worst status
    const statusMap = new Map(
      populatedService.statusHistory.map((day) => {
        const dayDate = new Date(day.date);
        dayDate.setUTCHours(0, 0, 0, 0);

        // Find worst status for the day
        const worstStatus = day.statuses.reduce((worst, current) => {
          const statusPriority = { operational: 0, degraded: 1, down: 2 };
          return statusPriority[current.value] > statusPriority[worst.value] ? current : worst;
        }, day.statuses[0]);

        return [dayDate.toISOString().split("T")[0], worstStatus?.value || "no_data"];
      })
    );

    // Fill in any missing dates
    const dailyStatuses = [];
    for (let d = new Date(startDate); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateKey = new Date(d);
      dateKey.setUTCHours(0, 0, 0, 0);
      const dateStr = dateKey.toISOString().split("T")[0];

      dailyStatuses.push({
        date: dateKey,
        status: statusMap.get(dateStr) || "no_data",
      });
    }

    // Calculate uptime percentage
    const operationalDays = dailyStatuses.filter((day) => day.status === "operational").length;
    const uptimePercentage = (operationalDays / dailyStatuses.length) * 100;

    const serviceData = {
      id: populatedService._id,
      name: populatedService.name,
      description: populatedService.description,
      status: populatedService.status,
      uptime: uptimePercentage.toFixed(2),
      statusHistory: populatedService.statusHistory,
      dailyWorstStatuses: dailyStatuses.map((day) => ({
        date: day.date.toISOString().split("T")[0],
        status: day.status,
      })),
      incidents,
    };

    // Emit WebSocket event only for public status page
    websocket.emitOrgUpdate(req.organizationId, "serviceUpdate", {
      type: "update",
      service: serviceData,
    });

    res.json(serviceData);
  } catch (err) {
    console.error("Error updating service status:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete service
router.delete("/:id", async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Emit WebSocket event
    websocket.emitOrgUpdate(req.organizationId, "serviceUpdate", {
      type: "delete",
      service: {
        ...service.toObject(),
        last90days: service.statusHistory?.slice(-90) || [],
      },
    });

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Error deleting service" });
  }
});

module.exports = router;
