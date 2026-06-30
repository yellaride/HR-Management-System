"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Briefcase, 
  FileText, 
  Key, 
  Shield, 
  X, 
  CheckCircle2, 
  Upload, 
  Lock 
} from "lucide-react";

export default function AdminSettingsPage() {
  // Public Profile State
  const [profile, setProfile] = useState({
    name: "Alexander Wright",
    email: "alex.wright@vibeflow.com",
    position: "Senior Admin / Tech Lead",
    bio: "Managing cross-functional workspace infrastructure, directory directories, and security vectors at VibeFlow.",
  });

  // UI Interactive States
  const [isSavedNoticeOpen, setIsSavedNoticeOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Handle general profile submission
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API update execution
    setIsSavedNoticeOpen(true);
    setTimeout(() => {
      setIsSavedNoticeOpen(false);
    }, 4000);
  };

  // Handle password change form submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Simple matching checks
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    // Simulate API password reset execution
    console.log("Password securely updated in database.");
    alert("Password successfully updated securely.");
    
    // Clean states & close modal
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="   pb-12">
      
      {/* 1. Page Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="mt-1 text-xs text-slate-500">
          Modify your administrator profile coordinates, update login credentials, and handle security protocols.
        </p>
      </div>

      {/* Profile Saved Success Banner Notification */}
      {isSavedNoticeOpen && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>Profile configuration saved successfully in database.</span>
        </div>
      )}

      {/* 2. Main Page Columns (Two cards layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Card: Profile Settings (Col-span-2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Public Profile Details</span>
            </h2>
          </div>

          <form onSubmit={handleProfileSave} className="p-6 space-y-5">
            
            {/* Custom Avatar Upload Field */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center border border-white/10 shadow-md">
                AD
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Profile Image</h4>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

            </div>

            {/* Position / Role Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Position Designation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Biography Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Biography / Bio
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Save Button Container */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>

          </form>
        </div>

        {/* Right Card: Security Configuration Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Security Controls</span>
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span>We recommend updating your authentication parameters periodically to guarantee access compliance.</span>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              <Key className="w-4 h-4 text-slate-500" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setIsPasswordModalOpen(false)} 
          />

          {/* Modal layout box */}
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">Change Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please fill out credentials to update passwords.</p>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Input fields form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
              
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700">
                  {passwordError}
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Modal controls submit / cancel bar */}
              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition"
                >
                  Update Password
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}