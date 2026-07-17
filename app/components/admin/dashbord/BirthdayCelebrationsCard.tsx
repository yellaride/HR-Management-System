import React from "react";
import { Cake } from "lucide-react";

interface Celebrant {
  name: string;
  designation?: string;
  department?: string;
  profilePhotoUrl?: string;
  profilePhotoURL?: string;
  profilePicture?: string;
  image?: string;
  picture?: string;
}

interface BirthdayCelebrationsCardProps {
  celebrants: Celebrant[];
}

export default function BirthdayCelebrationsCard({
  celebrants,
}: BirthdayCelebrationsCardProps) {
  if (!celebrants || celebrants.length === 0) return null;

  return (
    <div className="birthday-card">
      <div className="birthday-card-overlay" />

      <div className="birthday-card-header">
        <div className="flex items-center gap-2.5">
          <div className="birthday-card-bday-icon">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            {/* Escaped the apostrophe using &apos; */}
            <h2 className="birthday-card-header-title">Today&apos;s Celebrations</h2>
            <p className="birthday-card-header-subtitle">
              Warm birthday wishes to our team members celebrating today
            </p>
          </div>
        </div>
        <span className="birthday-card-celebrants-chip self-start sm:self-center">
          {celebrants.length} {celebrants.length === 1 ? "Celebrant" : "Celebrants"}
        </span>
      </div>

      <div className="birthday-celebrants-list">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {celebrants.map((emp, idx) => (
            <div
              key={idx}
              className="birthday-celebrant-tile"
            >
              <div className="birthday-celebrant-avatar overflow-hidden relative">
                {(emp.profilePhotoUrl ||
                emp.profilePhotoURL ||
                emp.profilePicture ||
                emp.image ||
                emp.picture) ? (
                  <img
                    src={
                      emp.profilePhotoUrl ||
                      emp.profilePhotoURL ||
                      emp.profilePicture ||
                      emp.image ||
                      emp.picture
                    }
                    alt={emp.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  (emp.name || "Employee")
                    .split(" ")
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-[var(--color-content-main)] block truncate">
                  {emp.name}
                </span>
                <span className="text-[10px] text-[var(--color-content-secondary)] block truncate">
                  {emp.designation || "Team Member"} •
                  <span className="font-semibold text-brand-accent">{emp.department || "General"}</span>
                </span>
              </div>
              <span className="birthday-celebrant-emoji text-lg shrink-0" role="img" aria-label="party">
                🎉
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}