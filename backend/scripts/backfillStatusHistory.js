const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Service = require("../models/Service");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const statuses = ["operational", "degraded", "down"];
const weights = [0.8, 0.15, 0.05]; // 80% operational, 15% degraded, 5% down

// Function to get random status based on weights
function getRandomStatus() {
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return statuses[i];
  }
  return statuses[0];
}

// Function to get random number of status changes for a day (1-3)
function getRandomStatusCount() {
  return Math.floor(Math.random() * 3) + 1;
}

// Function to get random time for a given date
function getRandomTime(date) {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

// Helper to get date with time set to midnight
const getDateWithoutTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function backfillStatusHistory() {
  try {
    const services = await Service.find();
    // console.log(`Found ${services.length} services to update`);

    for (const service of services) {
      const statusHistory = [];

      // Generate status for past 89 days
      for (let i = 89; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Generate 1-3 status changes for each day
        const statusCount = getRandomStatusCount();
        const dayStatuses = [];

        for (let j = 0; j < statusCount; j++) {
          dayStatuses.push({
            value: getRandomStatus(),
            timestamp: getRandomTime(date),
          });
        }

        // Sort statuses by timestamp
        dayStatuses.sort((a, b) => b.timestamp - a.timestamp);

        // Add day entry
        statusHistory.push({
          date: getDateWithoutTime(date),
          statuses: dayStatuses,
        });
      }

      // Add today with operational status
      const today = new Date();
      const todayEntry = {
        date: getDateWithoutTime(today),
        statuses: [
          {
            value: "operational",
            timestamp: today,
          },
        ],
      };
      statusHistory.push(todayEntry);

      // Sort days by date (newest first)
      statusHistory.sort((a, b) => b.date - a.date);

      // Update service with new status history
      service.statusHistory = statusHistory;
      await service.save();
      console.log(`Updated status history for service: ${service.name}`);
    }

    console.log("Status history backfill completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error backfilling status history:", error);
    process.exit(1);
  }
}

backfillStatusHistory();
