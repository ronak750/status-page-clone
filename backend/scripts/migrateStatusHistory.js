const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Service = require("../models/Service");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateStatusHistory() {
  try {
    const services = await Service.find();
    console.log(`Found ${services.length} services to migrate`);

    for (const service of services) {
      // Create new status history structure
      const newStatusHistory = [];
      
      // Group the old status history by date
      const statusByDate = new Map();
      
      if (service.statusHistory && Array.isArray(service.statusHistory)) {
        service.statusHistory.forEach(entry => {
          if (entry.date && entry.status) {  // Check if old format
            const dateStr = new Date(entry.date).toISOString().split('T')[0];
            if (!statusByDate.has(dateStr)) {
              statusByDate.set(dateStr, {
                date: new Date(dateStr),
                statuses: []
              });
            }
            
            // Add status to the array for this date
            statusByDate.get(dateStr).statuses.push({
              value: entry.status,
              timestamp: entry.date
            });
          }
        });

        // Convert map to array and sort by date
        newStatusHistory.push(...Array.from(statusByDate.values()));
        newStatusHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      // Update the service with new structure
      service.statusHistory = newStatusHistory;
      await service.save();
      console.log(`Migrated status history for service: ${service.name}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateStatusHistory();
