const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const User = require("../models/User");

// Create a new organization
router.post("/", async (req, res) => {
  console.log("Creating organization:", req.body);
  try {
    const { name, adminId } = req.body;

    // Create organization
    const organization = new Organization({
      name,
      adminId,
      members: [
        {
          userId: adminId,
          role: "admin",
        },
      ],
    });

    const savedOrg = await organization.save();
    console.log("Organization created:", savedOrg);

    // Set organization for user
    await User.findOneAndUpdate(
      { clerkId: adminId },
      {
        organizationId: savedOrg._id,
        role: "admin",
      }
    );

    res.status(201).json(savedOrg);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ message: "Error creating organization" });
  }
});

module.exports = router;
