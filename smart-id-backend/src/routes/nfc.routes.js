import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import Patient from "../models/Patient.js";
import { 
    handleNfcScan, 
    verifyFingerprint, 
    generateHardwareOtp,
    getPatientByNfc 
} from "../controllers/nfc.controller.js";

const router = express.Router();

// ==========================================
// 🔴 HARDWARE INTEGRATION ROUTES (Raspberry Pi)
// ==========================================

// 1️⃣ Raspberry Pi posts NFC UID
router.post("/scan", handleNfcScan);

// 2️⃣ Raspberry Pi posts Fingerprint matches
router.post("/fingerprint", verifyFingerprint);

// 3️⃣ Raspberry Pi requests OTP to send via SIM800L
router.post("/generate-otp", generateHardwareOtp);


// ==========================================
// 🔵 FRONTEND ROUTES (User/Doctor interactions)
// ==========================================

// 🏥 Scan NFC (Simplified/Auth version for demo dashboards)
router.get("/patients/nfc/:id", protect, async (req, res) => {
    try {
        const patient = await Patient.findOne({ nfcUuid: req.params.id })
            .populate('user', 'name username');
            
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        res.json({
            id: req.params.id,
            name: patient.fullName || "Unknown",
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            condition: "Cardiology Consultation",
            time: new Date().toLocaleString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Primary lookup route via GET
router.get("/patient/:nfcId", protect, getPatientByNfc);

export default router;
