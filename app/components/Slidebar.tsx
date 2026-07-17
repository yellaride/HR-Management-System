"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// Define TypeScript interfaces for structural safety
interface SidebarProps {
  role?: "admin" | "employee";
}

// Navigation items with visual SVG icons for both Admin and Employee roles
const navItems = {
  admin: [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/admin/employees",
      label: "Employees",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/payslips",
      label: "Payslips",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/leaves",
      label: "Leave Manager",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/leaves-policy",
      label: "Leaves Policy",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/activity",
      label: "Activity",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 15a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h6" />
        </svg>
      ),
    },
    {
      href: "/admin/employee-attendance",
      label: "Attendance Record",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 11l3 3L22 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      href: "/admin/birthdays",
      label: "Birthdays",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 10h.01M15 10h.01" />
        </svg>
      ),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
   
  ],
  employee: [
    {
      href: "/employee/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/employee/profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      href: "/employee/attendance",
      label: "Attendance",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/employee/leaves-request",
      label: "Leave",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/employee/payslip-employee",
      label: "Payslips",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { data: session } = useSession();

  // Desktop-only collapsible behavior
  // State persists across navigation; default expanded.
  const [collapsed, setCollapsed] = useState(false);

  // Watch for session errors (such as Token/Session expiration from global logout)

  useEffect(() => {
    if (session?.error === "SessionExpired") {
      // Clear local session storage and redirect to the home page securely
      signOut({ callbackUrl: "/" });
    }
  }, [session]);

  // 1. Safe role detection from session
  const sessionRole = session?.user?.role?.trim().toLowerCase();
  const isAdminFromSession = sessionRole === "admin";
  const isEmployeeFromSession = sessionRole === "employee";

  // 2. Fallback path-based role
  const fallbackPathRole: "admin" | "employee" = 
    pathname.startsWith("/admin") ? "admin" : "employee";

  // 3. Determine final display role with the prop 'role' prioritized first
  const displayRole: "admin" | "employee" =
    role ||
    (isAdminFromSession ? "admin" : isEmployeeFromSession ? "employee" : null) ||
    fallbackPathRole;

  const activeNavItems = navItems[displayRole];

  // 4. Default mock data matching the display context
  const defaultProfile =
    displayRole === "admin"
      ? { name: "Admin User", email: "admin@vibeflow.com", avatarLabel: "AD" }
      : { name: "Employee User", email: "employee@vibeflow.com", avatarLabel: "EM" };

  // 5. Ensure profile name, email, and role match the context of the sidebar layout being viewed
  const matchesActiveContext = sessionRole === displayRole;
  const currentProfile = {
    role: displayRole,
    name: matchesActiveContext && session?.user?.name ? session.user.name : defaultProfile.name,
    email: matchesActiveContext && session?.user?.email ? session.user.email : defaultProfile.email,
    avatarLabel: defaultProfile.avatarLabel,
  };

  return (
<aside className="w-full min-w-0 lg:w-[220px] h-auto lg:h-screen lg:max-h-screen flex flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-100 p-5 shadow-xl select-none overflow-hidden">
      {/* Upper Section: Profile Header & Navigation */}
      <div className="flex flex-col gap-8">
        
        {/* Dynamic Profile Section */}
        <div className="flex items-center gap-3.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800/40">
          <div className="relative">
            {/* Unified Gradient on Profile Avatar matches Website Primary Purple Accent */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-accent to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-sm border border-white/10">
              {currentProfile.avatarLabel}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" />
          </div>

          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="font-bold text-sm tracking-tight text-white leading-tight truncate">
              {displayRole === "admin" ? "Admin User" : "Employee User"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate leading-tight mt-0.5">
              {currentProfile.email}
            </span>
          </div>
        </div>

        {/* Dynamic Category Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-3">
            {displayRole === "admin" ? "Core Management" : "Employee Portal"}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <ul className="space-y-1">
              {activeNavItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                        isActive
                          ? "bg-brand-accent text-white shadow-sm shadow-brand-accent/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom Section: Logout Action */}
      <div className="pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={async () => {
            await signOut({ redirect: false });
            router.push("/");
            router.refresh();
          }}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-150"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}