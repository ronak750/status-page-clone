const User = require("../models/User");

const getOrganization = async (req, res, next) => {
  try {
    const clerkId = req.query.clerkId || req.body.clerkId;

    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.organizationId) {
      return res.status(400).json({ message: "User has no organization" });
    }

    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    console.error("Error in getOrganization middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = getOrganization;
