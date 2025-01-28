const mongoose = require("mongoose");
require("dotenv").config();
const Service = require("./models/Service");
const Incident = require("./models/Incident");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const services = [
  {
    name: "API Gateway",
    description: "Main API Gateway service for all client requests",
    status: "operational"
  },
  {
    name: "Authentication Service",
    description: "User authentication and authorization service",
    status: "operational"
  },
  {
    name: "Database Service",
    description: "Primary database service",
    status: "operational"
  }
];

const createIncidents = async (serviceId) => {
  const statuses = ["investigating", "identified", "monitoring", "resolved"];
  const pastDates = [30, 20, 10, 5, 2]; // days ago

  const incidents = pastDates.map(days => ({
    service: serviceId,
    title: `Service Degradation`,
    description: `Experiencing increased latency and reduced performance`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
  }));

  return await Incident.insertMany(incidents);
};

async function seedData() {
  try {
    // Clear existing data
    await Service.deleteMany({});
    await Incident.deleteMany({});

    // Create services
    const createdServices = await Service.insertMany(services);
    console.log("Services created:", createdServices);

    // Create incidents for each service
    for (const service of createdServices) {
      const incidents = await createIncidents(service._id);
      console.log(`Created ${incidents.length} incidents for service: ${service.name}`);
    }

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.disconnect();
  }
}

seedData();
