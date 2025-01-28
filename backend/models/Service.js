const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["operational", "degraded", "down"],
      default: "operational",
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    statusHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        statuses: [
          {
            value: {
              type: String,
              enum: ["operational", "degraded", "down"],
              required: true,
            },
            timestamp: {
              type: Date,
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Status priority for determining worst status
const statusPriority = {
  down: 3,
  degraded: 2,
  operational: 1,
};

// Helper to get date string (YYYY-MM-DD)
function getDateString(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// Helper to get date with time set to midnight UTC
function getDateWithoutTime(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Virtual for getting daily worst statuses
serviceSchema.virtual('dailyWorstStatuses').get(function() {
  const dailyStatuses = new Map();

  // Process all status history entries
  this.statusHistory.forEach(day => {
    const dateStr = getDateString(day.date);
    
    if (!dailyStatuses.has(dateStr)) {
      dailyStatuses.set(dateStr, {
        date: getDateWithoutTime(day.date),
        status: null,
        priority: 0
      });
    }

    // Find worst status for the day
    day.statuses.forEach(status => {
      const priority = statusPriority[status.value];
      const current = dailyStatuses.get(dateStr);
      
      if (priority > current.priority) {
        current.status = status.value;
        current.priority = priority;
      }
    });
  });

  // Convert map to array and sort by date
  return Array.from(dailyStatuses.values())
    .sort((a, b) => a.date - b.date);
});

// Middleware to update status history when status changes
serviceSchema.pre("save", async function(next) {
  if (this.isModified("status")) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = getDateString(today);
    
    // Find today's entry in status history
    let todayEntry = this.statusHistory.find(
      entry => getDateString(entry.date) === todayStr
    );

    // Create new entry for today if it doesn't exist
    if (!todayEntry) {
      todayEntry = {
        date: today,
        statuses: []
      };
      this.statusHistory.push(todayEntry);
    }

    // Add new status
    todayEntry.statuses.push({
      value: this.status,
      timestamp: new Date()  // Current time in UTC
    });
  }
  next();
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
