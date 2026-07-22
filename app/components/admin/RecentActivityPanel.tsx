"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Calendar, FileText, Heart, User } from "lucide-react";

interface Activity {
  _id: string;
  user: string;
  action: string;
  type: string;
  createdAt: string;
}

export function RecentActivityPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const res = await fetch("/api/admin/activity", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Display the top 4 activities
          setActivities(data.logs?.slice(0, 4) || []);
        }
      } catch (e) {
        console.error("Failed to load recent activities:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";
  };

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "attendance":
        return {
          indicator: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: CheckSquare,
        };
      case "leave":
        return {
          indicator: "bg-amber-500",
          badge: "bg-amber-50 text-amber-700 border-amber-100",
          icon: Calendar,
        };
      case "payslip":
        return {
          indicator: "bg-blue-500",
          badge: "bg-blue-50 text-blue-700 border-blue-100",
          icon: FileText,
        };
      case "birthday":
        return {
          indicator: "bg-pink-500",
          badge: "bg-pink-50 text-pink-700 border-pink-100",
          icon: Heart,
        };
      default:
        return {
          indicator: "bg-slate-400",
          badge: "bg-slate-50 text-slate-700 border-slate-100",
          icon: User,
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diffMs = new Date().getTime() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2">
        <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading dynamic activities...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No recent activities found in logs.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {activities.map((act) => {
        const config = getActivityConfig(act.type);
        return (
          <div
            key={act._id}
            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm animate-fade-in"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Initials Badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${config.badge}`}>
                {getInitials(act.user)}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-semibold text-slate-900">{act.user}</span>
                <span className="text-slate-500 text-xs sm:text-sm">{act.action}</span>
              </div>
            </div>

<div className="flex items-center gap-2 shrink-0 pl-0">
              <span className={`w-1.5 h-1.5 rounded-full ${config.indicator}`} />
              <span className="text-xs text-slate-400 font-medium">{formatTimeAgo(act.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}