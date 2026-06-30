import React, { useState } from "react";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
    status: string;
  }) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSave }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "Engineering",
    status: "Active",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;

    onSave(formData);

    // Reset inputs
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      department: "Engineering",
      status: "Active",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Dark backdrop overlay with slight blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* White Modal Container */}
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-950">Add New Employee</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a new profile in the company directory.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Liam Parker"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Email Address Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Temporary Password
            </label>
            <input
              type="password"
              required
              placeholder="Set employee password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Job Title Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Job Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Frontend Engineer"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Department & Status fields (Side by Side Grid) */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Department Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

          </div>

          {/* Actions Bottom Bar */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition"
            >
              Create Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}