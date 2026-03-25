import api from "../services/api";

const hospitalAPI = {
    registerPatient: async (payload) => {
        const res = await api.post("/patient/register", payload);
        return res.data;
    },

    // Patient Session & NFC
    getPatientByNfc: async (nfcId) => {
        const res = await api.get(`/doctor/patient/${nfcId}`);
        return res.data;
    },
    scanNfc: async (uid) => {
        const res = await api.post("/nfc/scan", uid ? { uid } : {});
        return res.data;
    },

    // OTP Consent flow - Patient OTP
    sendOtp: async (phone, patientId) => {
        const res = await api.post("/otp/send-otp", { 
            phone,
            purpose: 'consent',
            isNominee: false,
            patientId 
        });
        return res.data;
    },
    
    // OTP Consent flow - Nominee OTP
    sendNomineeOtp: async (phone, patientId) => {
        const res = await api.post("/otp/send-otp", { 
            phone,
            purpose: 'consent',
            isNominee: true,
            patientId 
        });
        return res.data;
    },
    
    // Verify OTP - Patient
    verifyOtp: async (phone, otp, patientId) => {
        const res = await api.post("/otp/verify-otp", { 
            phone, 
            otp,
            purpose: 'consent',
            isNominee: false,
            patientId 
        });
        return res.data;
    },
    
    // Verify OTP - Nominee
    verifyNomineeOtp: async (phone, otp, patientId) => {
        const res = await api.post("/otp/verify-otp", { 
            phone, 
            otp,
            purpose: 'consent',
            isNominee: true,
            patientId 
        });
        return res.data;
    },
    
    // Resend OTP based on consent type
    resendOtp: async (phone, patientId, isNominee = false) => {
        const res = await api.post("/otp/send-otp", { 
            phone,
            purpose: 'consent',
            isNominee,
            patientId 
        });
        return res.data;
    },

    // Biometric Verification
    verifyBiometric: async (payload) => {
        const res = await api.post("/nfc/fingerprint", payload);
        return res.data;
    },

    enrollFingerprint: async (patientId) => {
        const res = await api.post("/nfc/enroll", { patientId });
        return res.data;
    },

    // Emergency Override
    authenticateEmergencyManager: async (credentials) => {
        const res = await api.post("/hospital/emergency/auth", credentials);
        return res.data;
    },

    // Clinical Records
    createEmr: async (payload) => {
        const res = await api.post(`/patient/${payload.patientId}/notes`, payload);
        return res.data;
    },

    // Statistics
    getStats: async () => {
        const res = await api.get("/hospital/stats");
        return res.data;
    },
    
    // Get Patient Full Details (for nominee info)
    getPatientDetails: async (patientId) => {
        const res = await api.get(`/patient/${patientId}/view`);
        return res.data;
    },
};

export default hospitalAPI;
