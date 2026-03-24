import express from "express";

const router = express.Router();

/**
 * Simplified Auth Route
 * Includes hardcoded fallback for debugging and deployment testing as requested.
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Hardcoded Debug User
  if (username === "hospital1" && password === "123456") {
    return res.json({ 
        success: true, 
        message: "Login successful (Debug mode)",
        user: {
            id: "debug-id",
            name: "Hospital Manager",
            username: "hospital1",
            role: "hospital"
        },
        token: "debug-token" // Placeholder token
    });
  }

  // Real auth logic can be added here or delegated back to controllers
  return res.status(401).json({ message: "Invalid credentials" });
});

export default router;
