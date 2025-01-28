const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Organization = require("../models/Organization");

// Get current user info
router.get("/me", async (req, res) => {
  try {
    const { clerkId } = req.query;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Get user's organization ID
router.get("/organization", async (req, res) => {
  try {
    const { clerkId } = req.query;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json({
      organizationId: user.organizationId,
      organizationName: organization.name,
    });
  } catch (error) {
    console.error("Error fetching user organization:", error);
    res.status(500).json({ message: "Error fetching user organization" });
  }
});

// Sync user from Clerk
router.post("/sync", async (req, res) => {
  console.log("Syncing user:", req.body);
  try {
    //console.log("Syncing user:", req.body);
    const { id: clerkId, email_addresses, first_name, last_name, image_url } = req.body;

    // Find user by clerkId or email
    //console.log("Email:", email_addresses[0].email_Address);
    let user = await User.findOne({
      $or: [{ clerkId }, { email: email_addresses[0].emailAddress, status: "invited" }],
    });

    //console.log("User:", user);

    if (user) {
      // If this is an invited user being activated
      if (user.status === "invited" && !user.clerkId) {
        user.clerkId = clerkId;
        user.status = "active";
        user.email = email_addresses[0].emailAddress;
        user.firstName = first_name;
        user.lastName = last_name;
        user.imageUrl = image_url;
        await user.save();
      }
      // Just update lastSignIn for existing users
      user.lastSignIn = new Date();
      await user.save();
      res.json(user);
    } else {
      // Create new user
      const newUser = new User({
        clerkId,
        email: email_addresses[0].emailAddress,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
        lastSignIn: new Date(),
        status: "active",
      });
      await newUser.save();
      res.json(newUser);
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Error syncing user" });
  }
});

module.exports = router;
