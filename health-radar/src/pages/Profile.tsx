import React, { useState, useEffect } from "react";
import { m } from "framer-motion";
import { supabase } from "../lib/supabase";
import { 
  User, Mail, Bell, ShieldCheck, Edit3, 
  Save, LogOut, Activity, Globe, Zap, History, 
  Settings2, Lock, ChevronRight, X 
} from "lucide-react";
import iso from "iso-3166-1";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileProps {
  user: SupabaseUser | null;
  isDark: boolean;
  onLogout: () => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ user: propUser, isDark, onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    alertsEnabled: true
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData({
          name: user.user_metadata?.name || "",
          country: user.user_metadata?.country || "",
          alertsEnabled: user.user_metadata?.alerts_enabled ?? true
        });
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { 
        name: formData.name, 
        country: formData.country,
        alerts_enabled: formData.alertsEnabled 
      }
    });
    if (!error) setIsEditing(false);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] pt-24 pb-20 font-poppins transition-colors duration-500 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-brand-red/5 to-transparent dark:from-brand-red/10 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* UPPER SECTION: Identity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-2xl">
                {/* Visual Placeholder: Clean Icon instead of Camera/Upload */}
                <User size={64} className="text-slate-300 dark:text-slate-600" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-black uppercase tracking-widest mb-3 border border-brand-red/20">
                <ShieldCheck size={12}/> Verified Account
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                {formData.name || "User Profile"}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Mail size={14} className="text-brand-red" /> {user.email}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-red transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
            >
              {isEditing ? <X size={14} /> : <Settings2 size={14} />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </m.div>

          <m.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-red rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-brand-red/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <ShieldCheck size={32} className="opacity-50" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Security Tier</p>
              <p className="text-2xl font-black uppercase leading-none mt-1">L3 Access</p>
            </div>
          </m.div>
        </div>

        {/* MIDDLE SECTION: Settings & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-red rounded-full" />
                Account Settings
              </h3>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      disabled={!isEditing}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-red/30 outline-none dark:text-white transition-all disabled:opacity-50 font-bold text-sm shadow-inner"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country / Region</label>
                    <div className="relative">
                      <select 
                        disabled={!isEditing}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-red/30 outline-none dark:text-white transition-all disabled:opacity-50 font-bold text-sm appearance-none cursor-pointer shadow-inner"
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                      >
                        <option value="">Select Country</option>
                        {iso.all().map(c => <option key={c.alpha2} value={c.country}>{c.country}</option>)}
                      </select>
                      <Globe size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#f8fafc] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group transition-all hover:border-brand-red/20">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-brand-red group-hover:scale-110 transition-transform">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Outbreak Alerts</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tight">Email notifications for regional health risks</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-110">
                    <input 
                      type="checkbox" 
                      disabled={!isEditing} 
                      checked={formData.alertsEnabled} 
                      onChange={(e) => setFormData({...formData, alertsEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red shadow-inner"></div>
                  </label>
                </div>

                {isEditing && (
                  <m.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleUpdate}
                    className="w-full py-5 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand-red/30 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {loading ? "Saving..." : <><Save size={18}/> Save Profile Changes</>}
                  </m.button>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <Activity size={14} className="text-brand-red"/> Account Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 text-slate-400">
                    <History size={16} />
                    <span className="text-[10px] font-black uppercase">Last Active</span>
                  </div>
                  <span className="text-xs font-black dark:text-white">Just Now</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Zap size={16} />
                    <span className="text-[10px] font-black uppercase">Efficiency</span>
                  </div>
                  <span className="text-xs font-black text-brand-red">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-brand-red/5 pointer-events-none" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red mb-6 flex items-center gap-2">
                <Lock size={14}/> Security Control
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/update-password'}
                  className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-between px-6"
                >
                  Change Password <ChevronRight size={14} className="text-brand-red" />
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Profile;