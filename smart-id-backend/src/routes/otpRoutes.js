import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";
import { otpLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
