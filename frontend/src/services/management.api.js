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

    // OTP Consent flow
    sendOtp: async (phone) => {
        const res = await api.post("/otp/send-otp", { phone });
        return res.data;
    },
    verifyOtp: async (payload) => {
        const res = await api.post("/otp/verify-otp", payload);
        return res.data;
    },
    resendOtp: async (phone) => {
        const res = await api.post("/otp/send-otp", { phone });
        return res.data;
    },
    // sendNomineeOtp: (patientId) => api.post("/hospital/otp/send-nominee", { patientId }), // No backend match yet

    // Biometric Verification
    verifyBiometric: async (payload) => {
        const res = await api.post("/nfc/fingerprint", payload);
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
};

export default hospitalAPI;
