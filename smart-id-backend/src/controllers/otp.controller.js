import Otp from "../models/Otp.js";
import jwt from "jsonwebtoken";
import LoginAudit from "../models/LoginAudit.js";
import Patient from "../models/Patient.js";

// SEND OTP
export const sendOtp = async (req, res) => {
    try {
        const { phone, purpose = 'login' } = req.body;

        if (!phone) {
            return res.status(400).json({
                error: "Phone number is required"
            });
        }

        // Additional Phone-Level Protection (Security)
        const recentRequests = await LoginAudit.countDocuments({
            phone,
            status: "OTP_SENT",
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }
        });

        if (recentRequests >= 3) {
            return res.status(429).json({
                error: "Too many OTP requests for this number. Try again in 10 minutes."
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000);

        // Save to Database
        await Otp.findOneAndUpdate(
            { phone, purpose },
            { otp, expiresAt: expires, attempts: 0, createdAt: new Date() },
            { upsert: true }
        );

        const smsGatewayUrl = process.env.SMS_GATEWAY_URL;

        if (smsGatewayUrl) {
            const smsResponse = await fetch(smsGatewayUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp })
            });

            if (!smsResponse.ok) {
                throw new Error(`SMS gateway failed with status ${smsResponse.status}`);
            }
        } else {
            console.warn("SMS_GATEWAY_URL not configured. OTP generated without external SMS dispatch.");
        }

        // Record Audit Event
        await LoginAudit.create({
            phone,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            status: "OTP_SENT"
        });

        // Response
        res.json({
            success: true,
            message: "OTP sent",
            otp // remove in production
        });

    } catch (err) {
        console.error(err.response?.data || err);
        res.status(500).json({
            error: "SMS sending failed"
        });
    }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
    const { phone, otp, purpose = 'login' } = req.body;

    try {
        if (!phone || !otp) {
            return res.status(400).json({ error: "Phone number and OTP are required" });
        }

        const record = await Otp.findOne({ phone, purpose });

        if (!record) {
            return res.status(400).json({ error: "OTP not found" });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({ error: "OTP expired" });
        }

        // Limit Wrong OTP Attempts
        if (record.otp !== otp) {
            record.attempts += 1;
            await record.save();

            if (record.attempts > 3) {
                await Otp.deleteOne({ phone, purpose });

                await LoginAudit.create({
                    phone,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"],
                    status: "LOGIN_FAILED"
                });

                return res.status(403).json({
                    error: "Too many incorrect attempts. Token cleared."
                });
            }

            return res.status(400).json({ error: "Invalid OTP" });
        }

        await Otp.deleteOne({ phone, purpose });

        // Record Audit Event on Success
        await LoginAudit.create({
            phone,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            status: "LOGIN_SUCCESS"
        });

        const patient = await Patient.findOne({ phone }).populate('user');

        if (!patient?.user) {
            return res.status(404).json({
                error: "No patient account is linked to this phone number"
            });
        }

        const token = jwt.sign(
            {
                id: patient.user._id,
                patientId: patient._id,
                phone,
                role: patient.user.role,
                name: patient.user.name,
                username: patient.user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "10d" }
        );

        res.json({
            message: "Login successful",
            success: true,
            token,
            user: {
                id: patient.user._id,
                patientId: patient._id,
                name: patient.user.name,
                username: patient.user.username,
                role: patient.user.role,
                phone: patient.phone
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
