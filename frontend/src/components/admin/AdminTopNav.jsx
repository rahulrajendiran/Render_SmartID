import { useAuth } from "../../auth/AuthProvider";

export default function AdminTopNav() {
    const { user, logout } = useAuth();

    return (
        <header className="bg-[#0f172a] border-b border-slate-800 px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400 lg:hidden">menu</span>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Management Intelligence</h2>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-300 transition-all hover:bg-red-950/50"
                >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Logout
                </button>
                <div className="text-right">
                    <p className="text-sm font-bold text-white">{user?.name || "System Admin"}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Master Root Access</p>
                </div>
                <div className="size-10 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                </div>
            </div>
        </header>
    );
}
