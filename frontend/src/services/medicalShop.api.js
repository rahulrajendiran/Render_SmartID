import api from "../services/api";

const medicalShopApi = {
    scanHardwareNfc: async () => {
        const res = await api.post("/nfc/scan", {});
        return res.data;
    },
    scanNFC: async (uid) => {
        const res = await api.post("/medical-shop/nfc/scan", { uid });
        return res.data;
    },
    fetchPrescriptionPDF: async (prescriptionId) => {
        const res = await api.get(
            `/medical-shop/prescriptions/${prescriptionId}/pdf`,
            { responseType: "blob" }
        );
        return res.data;
    }
};

export default medicalShopApi;
