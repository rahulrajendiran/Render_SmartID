import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: {
        error: "Too many OTP requests. Try again after 10 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});
