import { useEffect, useState } from "react";
import doctorApi from "../../services/doctor.api";

export default function PatientHistory() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        doctorApi.getHistory()
            .then(setRecords)
            .catch(err => {
                console.error("Failed to load history", err);
                setRecords([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2">Treatment History</h1>
                <p className="text-slate-500">Secure record of patients previously scanned and treated by you.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Loading records...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-xs font-bold uppercase text-slate-400">Patient</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-slate-400">Date</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-slate-400">Treatment / Summary</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {r.patientName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-semibold">{r.patientName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500">{r.date}</td>
                                    <td className="px-8 py-5">{r.summary}</td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-primary font-bold text-sm hover:underline opacity-0 group-hover:opacity-100 transition-all">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && records.length === 0 && (
                    <div className="p-20 text-center text-slate-500">No treatment records found in your vault.</div>
                )}
            </div>
        </div>
    );
}
