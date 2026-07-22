"use client";

import React, { useState } from "react";
import { Users, Plus, Trash2, Loader2 } from "lucide-react";

interface DepartmentSettingsProps {
  departments: string[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

export default function DepartmentSettings({ departments, onAdd, onDelete }: DepartmentSettingsProps) {
  const [newDept, setNewDept] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const name = newDept.trim();
    if (!name) return;
    try {
      setAdding(true);
      await onAdd(name);
      setNewDept("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="panel bg-white border border-line-subtle rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-line-subtle">
        <Users className="w-5 h-5 text-brand-accent" />
        <h3 className="text-sm font-bold text-content-main">Department Management</h3>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter department name (e.g., Engineering)"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="form-input text-xs flex-1 p-2 border border-line-subtle rounded-lg outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newDept.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        </div>

        {departments.length === 0 ? (
          <p className="text-xs text-content-secondary italic">No departments configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {departments.map((dept) => (
              <div
                key={dept}
                className="flex items-center justify-between p-3 bg-surface-subtle border border-line-subtle rounded-xl text-xs"
              >
                <span className="font-semibold text-content-main truncate mr-2">{dept}</span>
                <button
                  type="button"
                  onClick={() => onDelete(dept)}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}