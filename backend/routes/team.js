const express = require("express");
const router = express.Router();
const User = require("../models/User");
const getOrganization = require("../middleware/getOrganization");

// Apply organization middleware to all routes
router.use(getOrganization);

// Get all team members
router.get("/", async (req, res) => {
  try {
    //console.log("Fetching team members for clerkId:", req.query.clerkId);
    const members = await User.find({
      organizationId: req.organizationId,
    });

    //console.log("Found members:", members);
    res.json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Error fetching team members" });
  }
});

// Invite a new team member
router.post("/invite", async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user is admin
    const admin = await User.findOne({ clerkId: req.body.clerkId });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can invite members" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but in a different org
      if (user.organizationId && user.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(400).json({ message: "User already belongs to another organization" });
      }
      // If user already in this org
      if (user.organizationId && user.organizationId.toString() === req.organizationId.toString()) {
        return res.status(400).json({ message: "User is already a member of this organization" });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      user = new User({
        email,
        role: role || "member", // Use provided role or default to member
        status: "invited",
        organizationId: req.organizationId,
        invitedBy: admin._id,
      });
      await user.save();
    }

    // TODO: Send invitation email
    // For now, just return success
    res.json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error inviting team member:", error);
    res.status(500).json({ message: "Error inviting team member" });
  }
});

// Remove a team member
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is admin
    const admin = await User.findOne({ clerkId: req.query.clerkId });
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Can't remove yourself
    if (admin._id.toString() === req.params.id) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Remove user from organization
    user.organizationId = null;
    user.role = "member";
    user.status = "inactive";
    await user.save();

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ message: "Error removing team member" });
  }
});

module.exports = router;
