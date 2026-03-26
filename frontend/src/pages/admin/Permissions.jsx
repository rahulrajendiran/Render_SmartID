import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import adminApi from "../../services/admin.api";
import toast from "react-hot-toast";

const PERMISSIONS_LIST = [
  { key: 'patient_register', label: 'Patient Register' },
  { key: 'emr_write', label: 'EMR Write' },
  { key: 'identity_view', label: 'Identity View' },
  { key: 'patient_search', label: 'Patient Search' },
  { key: 'prescription_view', label: 'Prescription View' },
  { key: 'prescription_create', label: 'Prescription Create' },
  { key: 'emergency_bypass', label: 'Emergency Bypass' },
  { key: 'consent_manage', label: 'Consent Manage' },
  { key: 'user_manage', label: 'User Manage' }
];

const ROLES = ['HOSPITAL', 'DOCTOR', 'PATIENT', 'MEDICAL_SHOP'];

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        enabled ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Permissions() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPermissions();
      
      // Convert lowercase API keys to uppercase (API returns: { hospital: {...} }, Frontend needs: { HOSPITAL: {...} })
      const formatted = {};
      for (const [key, value] of Object.entries(data)) {
        formatted[key.toUpperCase()] = value;
      }
      
      setPermissions(formatted);
      setOriginalPermissions(JSON.parse(JSON.stringify(formatted)));
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role, permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionKey]: !prev[role]?.[permissionKey]
      }
    }));
  };

  const getPendingCount = () => {
    let count = 0;
    ROLES.forEach(role => {
      PERMISSIONS_LIST.forEach(perm => {
        const original = originalPermissions[role]?.[perm.key] || false;
        const current = permissions[role]?.[perm.key] || false;
        if (original !== current) count++;
      });
    });
    return count;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const role of ROLES) {
        await adminApi.savePermissions({
          role: role.toLowerCase(),
          permissions: permissions[role] || {}
        });
      }
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      toast.success('Permissions saved successfully');
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    toast('Changes discarded');
  };

  const pendingCount = getPendingCount();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                <th className={`text-left pb-4 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Permission
                </th>
                {ROLES.map(role => (
                  <th key={role} className={`text-center pb-4 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {role.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS_LIST.map(perm => (
                <tr key={perm.key} className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <td className={`py-4 text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {perm.label}
                  </td>
                  {ROLES.map(role => {
                    const isEnabled = permissions[role]?.[perm.key] || false;
                    const originalEnabled = originalPermissions[role]?.[perm.key] || false;
                    const hasChanged = isEnabled !== originalEnabled;
                    
                    return (
                      <td key={`${role}-${perm.key}`} className="py-4 text-center">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            enabled={isEnabled}
                            onChange={() => handleToggle(role, perm.key)}
                          />
                          {hasChanged && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-amber-500"></span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`mt-10 h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl group transition-all ${isDark ? "text-slate-500 border-slate-800 bg-slate-900/50 hover:border-emerald-500/20" : "text-slate-400 border-slate-200 bg-slate-50 hover:border-emerald-400/30"}`}>
          <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">analytics</span>
          <p className="font-bold text-sm">Interactive Permissions Hierachy View</p>
          <p className="text-[10px] opacity-60">Visual interface for node-based logic</p>
        </div>
      </div>

      <div className={`fixed bottom-10 left-80 right-10 backdrop-blur-xl border p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom-10 duration-1000 ${isDark ? "bg-[#0f172a]/80 border-slate-700" : "bg-white/90 border-slate-200"}`}>
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-xl flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <span className="material-symbols-outlined">{pendingCount > 0 ? 'pending_actions' : 'check_circle'}</span>
          </div>
          <div>
            <span className={`font-bold block ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {pendingCount > 0 ? 'Policy Update Pending' : 'All Changes Saved'}
            </span>
            <span className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {pendingCount > 0 ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} to role-based access tokens` : 'Permissions are up to date'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDiscard}
            disabled={pendingCount === 0 || saving}
            className={`px-6 py-3 font-bold transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"} ${pendingCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={pendingCount === 0 || saving}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-slate-950 px-8 py-3 rounded-2xl font-black tracking-tight shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
                Saving...
              </>
            ) : (
              'Commit Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
