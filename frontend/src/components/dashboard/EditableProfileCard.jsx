"use client";

import { useState } from "react";
import { User, DropletIcon, Activity, Heart, ClipboardList, Phone, ShieldCheck, Stethoscope, Edit2, X, Check, Loader2 } from "lucide-react";
import { patientApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

export default function EditableProfileCard({ profile, onProfileUpdate, healthScore }) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Local state for editing
  const [formData, setFormData] = useState({
    blood_group: profile?.blood_group || "",
    height_cm: profile?.height_cm || "",
    weight_kg: profile?.weight_kg || "",
    allergies: profile?.allergies?.join(", ") || "",
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_phone: profile?.emergency_contact_phone || "",
    insurance_provider: profile?.insurance_provider || "",
    primary_doctor: profile?.primary_doctor || ""
  });

  const calculateBMI = () => {
    if (profile?.height_cm && profile?.weight_kg) {
      const hMeters = profile.height_cm / 100;
      return (profile.weight_kg / (hMeters * hMeters)).toFixed(1);
    }
    return "N/A";
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      
      const payload = {
        blood_group: formData.blood_group,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        allergies: formData.allergies ? formData.allergies.split(",").map(s => s.trim()) : [],
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        insurance_provider: formData.insurance_provider,
        primary_doctor: formData.primary_doctor,
      };
      
      const patientId = profile?.id || user?.id;
      
      await patientApi.updateProfile(patientId, payload);
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      setIsEditing(false);
    } catch (err) {
      setError(typeof err === 'object' ? err?.msg || err?.message || JSON.stringify(err) : err);
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="premium-card rounded-3xl p-6 relative flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg border border-white/50 text-white font-extrabold text-xl">
            {initials}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">{user?.full_name || "Patient"}</h3>
            <p className="text-xs text-slate-500 font-medium">Health Score: <span className="text-blue-600 font-bold">{healthScore}/100</span></p>
          </div>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Edit Profile"
          >
            <Edit2 size={16} />
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Content */}
      {!isEditing ? (
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <InfoBadge icon={DropletIcon} label="Blood" value={profile?.blood_group || "N/A"} color="text-red-600 bg-red-50 border-red-100" />
          <InfoBadge icon={Activity} label="BMI" value={calculateBMI()} color="text-blue-600 bg-blue-50 border-blue-100" />
          <InfoBadge icon={ClipboardList} label="Allergies" value={profile?.allergies?.join(", ") || "None"} color="text-amber-600 bg-amber-50 border-amber-100" />
          <InfoBadge icon={Phone} label="Emergency" value={profile?.emergency_contact_name ? `${profile.emergency_contact_name}` : "N/A"} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
          <InfoBadge icon={ShieldCheck} label="Insurance" value={profile?.insurance_provider || "N/A"} color="text-purple-600 bg-purple-50 border-purple-100" />
          <InfoBadge icon={Stethoscope} label="Primary Dr" value={profile?.primary_doctor || "N/A"} color="text-cyan-600 bg-cyan-50 border-cyan-100" />
        </div>
      ) : (
        <div className="space-y-3 mt-auto">
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Blood Group" value={formData.blood_group} onChange={v => setFormData({...formData, blood_group: v})} />
            <div className="flex gap-2">
              <EditField label="Height (cm)" type="number" value={formData.height_cm} onChange={v => setFormData({...formData, height_cm: v})} />
              <EditField label="Weight (kg)" type="number" value={formData.weight_kg} onChange={v => setFormData({...formData, weight_kg: v})} />
            </div>
          </div>
          <EditField label="Allergies (CSV)" value={formData.allergies} onChange={v => setFormData({...formData, allergies: v})} />
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Emergency Contact" value={formData.emergency_contact_name} onChange={v => setFormData({...formData, emergency_contact_name: v})} />
            <EditField label="Emergency Phone" value={formData.emergency_contact_phone} onChange={v => setFormData({...formData, emergency_contact_phone: v})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Insurance Provider" value={formData.insurance_provider} onChange={v => setFormData({...formData, insurance_provider: v})} />
            <EditField label="Primary Doctor" value={formData.primary_doctor} onChange={v => setFormData({...formData, primary_doctor: v})} />
          </div>
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

function InfoBadge({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-2xl border ${color} bg-opacity-70 backdrop-blur-sm`}>
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/5">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">{label}</p>
        <p className="text-xs font-bold truncate text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, type = "text", value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/60 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
      />
    </div>
  );
}
