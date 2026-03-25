import { useState } from "react";
import PermissionConfirmModal from "../../components/admin/PermissionConfirmModal";
import { useTheme } from "../../context/ThemeContext";

export default function Permissions() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            <div>
                <h2 className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Security Matrix</h2>
                <p className={`mt-2 font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>Define fine-grained access protocols for system roles</p>
            </div>

            <div className={`rounded-3xl border p-10 shadow-2xl ${isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-start gap-4 mb-8">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                        <span className="material-symbols-outlined">rule_settings</span>
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Global Permissions Overlay</h3>
                        <p className={`text-sm mt-1 uppercase tracking-widest font-bold text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Changes here affect all active session tokens</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['DOCTOR', 'HOSPITAL', 'PATIENT', 'MEDICAL_SHOP'].map((role) => (
                        <div key={role} className={`p-6 rounded-2xl border transition-all cursor-pointer group ${isDark ? "bg-slate-900 border-slate-800 hover:border-emerald-500/40" : "bg-slate-50 border-slate-200 hover:border-emerald-400"}`}>
                            <p className={`text-[10px] font-black tracking-[0.2em] mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{role}</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>EMR Write</span>
                                    <div className="w-8 h-4 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Identity View</span>
                                    <div className="w-8 h-4 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Emergency Bypass</span>
                                    <div className={`w-8 h-4 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`mt-10 h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl group transition-all ${isDark ? "text-slate-500 border-slate-800 bg-slate-900/50 hover:border-emerald-500/20" : "text-slate-400 border-slate-200 bg-slate-50 hover:border-emerald-400/30"}`}>
                    <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">analytics</span>
                    <p className="font-bold text-sm">Interactive Permissions Hierachy View</p>
                    <p className="text-[10px] opacity-60">Visual interface for node-based logic</p>
                </div>
            </div>

            <div className={`fixed bottom-10 left-80 right-10 backdrop-blur-xl border p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom-10 duration-1000 ${isDark ? "bg-[#0f172a]/80 border-slate-700" : "bg-white/90 border-slate-200"}`}>
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <span className={`font-bold block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Policy Update Pending</span>
                        <span className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>3 modifications to role-based access tokens</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className={`px-6 py-3 font-bold transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}>Discard</button>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-8 py-3 rounded-2xl font-black tracking-tight shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        Commit Changes
                    </button>
                </div>
            </div>

            {showConfirm && (
                <PermissionConfirmModal onClose={() => setShowConfirm(false)} />
            )}
        </div>
    );
}
