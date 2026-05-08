import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
  User, Mail, Bell, ShieldCheck, Save,
  LogOut, Globe, Lock, ChevronRight, X,
  Check, AlertCircle
} from "lucide-react";
import iso from "iso-3166-1";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileProps {
  user: SupabaseUser | null;
  isDark: boolean;
  onLogout: () => Promise<void>;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

const Profile: React.FC<ProfileProps> = ({ user: propUser, isDark, onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    alertsEnabled: true,
  });
  const [original, setOriginal] = useState(formData);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const data = {
          name: user.user_metadata?.name || "",
          country: user.user_metadata?.country || "",
          alertsEnabled: user.user_metadata?.alerts_enabled ?? true,
        };
        setFormData(data);
        setOriginal(data);
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async () => {
    setSaveStatus("saving");
    const { error } = await supabase.auth.updateUser({
      data: {
        name: formData.name,
        country: formData.country,
        alerts_enabled: formData.alertsEnabled,
      },
    });
    if (!error) {
      setSaveStatus("success");
      setOriginal(formData);
      setIsEditing(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleCancel = () => {
    setFormData(original);
    setIsEditing(false);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(original);

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user.email) return;
    setEmailStatus("saving");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (!error) {
      setEmailStatus("sent");
      setIsChangingEmail(false);
      setNewEmail("");
      setTimeout(() => setEmailStatus("idle"), 5000);
    } else {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 4000);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20 font-poppins transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-4">

        {/* Save status toast */}
        <AnimatePresence>
          {saveStatus === "success" && (
            <m.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium"
            >
              <Check size={16} /> Profile updated successfully.
            </m.div>
          )}
          {saveStatus === "error" && (
            <m.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium"
            >
              <AlertCircle size={16} /> Failed to update. Please try again.
            </m.div>
          )}
        </AnimatePresence>

        {/*  Identity card  */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-5"
        >
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <User size={32} className="text-slate-300 dark:text-slate-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formData.name || "Unnamed User"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="flex-shrink-0" />
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </m.div>

        {/*  Profile settings  */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your display name and region.</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Country / Region
                </label>
                <div className="relative">
                  <select
                    disabled={!isEditing}
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/40 disabled:opacity-50 disabled:cursor-not-allowed appearance-none transition-all"
                  >
                    <option value="">Select country</option>
                    {iso.all().map((c) => (
                      <option key={c.alpha2} value={c.country}>{c.country}</option>
                    ))}
                  </select>
                  <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Email Address
                </label>
                {!isChangingEmail ? (
                  <button
                    onClick={() => setIsChangingEmail(true)}
                    className="text-[11px] font-semibold text-brand-red hover:text-red-700 transition-colors"
                  >
                    Change
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsChangingEmail(false); setNewEmail(""); setEmailStatus("idle"); }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Current email — always visible */}
              <input
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed"
              />

              {/* New email input — shown when changing */}
              <AnimatePresence>
                {isChangingEmail && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/40 transition-all"
                    />
                    <button
                      onClick={handleEmailChange}
                      disabled={!newEmail || newEmail === user.email || emailStatus === "saving"}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Mail size={13} />
                      {emailStatus === "saving" ? "Sending..." : "Send Confirmation"}
                    </button>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      A confirmation link will be sent to both your current and new email address.
                    </p>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Email change status messages */}
              <AnimatePresence>
                {emailStatus === "sent" && (
                  <m.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <Check size={12} /> Confirmation sent — check both inboxes to complete the change.
                  </m.p>
                )}
                {emailStatus === "error" && (
                  <m.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-red-500 font-medium"
                  >
                    <AlertCircle size={12} /> Failed to send confirmation. Please try again.
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Save row */}
          <AnimatePresence>
            {isEditing && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end"
              >
                <button
                  onClick={handleUpdate}
                  disabled={!hasChanges || saveStatus === "saving"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-red text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Save size={13} />
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        {/* Notifications */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control how you receive alerts.</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell size={15} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Outbreak Alerts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Email notifications for regional health risks</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alertsEnabled}
                  onChange={(e) => {
                    const updated = { ...formData, alertsEnabled: e.target.checked };
                    setFormData(updated);
                    supabase.auth.updateUser({ data: { alerts_enabled: e.target.checked } });
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-brand-red transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
              </label>
            </div>
          </div>
        </m.div>

        {/* Security */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Security</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your password and session.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <button
              onClick={() => window.location.href = "/update-password"}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Lock size={15} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update your account password</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 flex items-center justify-center transition-colors">
                <LogOut size={15} className="text-slate-500 dark:text-slate-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Sign Out</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">End your current session</p>
              </div>
            </button>
          </div>
        </m.div>

        {/* Account info footer */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="flex items-center gap-2 px-2 text-xs text-slate-400 dark:text-slate-600"
        >
          <ShieldCheck size={12} />
          <span>Account ID: {user.id?.slice(0, 8)}...</span>
          <span className="mx-1">·</span>
          <span>Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </m.div>

      </div>
    </div>
  );
};

export default Profile;