import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import medicalShopApi from "../../services/medicalShop.api";

export default function PrescriptionViewer() {
    const { id } = useParams();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const urlRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        medicalShopApi.fetchPrescriptionPDF(id)
            .then((blob) => {
                if (!isMounted) return;
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                setPdfUrl(url);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("PDF Fetch failed:", err);
                toast.error("Unauthorized or expired session. Please re-scan the patient card.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold animate-pulse">Decrypting Prescription...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
            <header className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="font-bold text-slate-900 dark:text-white">
                        Pharmacy Dispensing View – SECURE PDF
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Authorized Pharmacist Access • ID: {id}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Encrypted Stream
                </div>
            </header>

            <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4">
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-2xl shadow-2xl border dark:border-slate-700"
                        title="Prescription PDF"
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                        Failed to load prescription document.
                    </div>
                )}
            </div>
        </div>
    );
}
