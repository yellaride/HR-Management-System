"use client";

import React from "react";
import { Palmtree, HeartPulse, Coffee } from "lucide-react";

interface Balance {
  allocated: number;
  used: number;
  remaining?: number;
}

interface LeaveBalancesProps {
  balances?: {
    ANNUAL?: Balance;
    SICK?: Balance;
    CASUAL?: Balance;
  };
}

export default function LeaveBalances({ balances }: LeaveBalancesProps) {
  // Safe fallback definitions to keep UI active without blanking
  const annualAllocated = balances?.ANNUAL?.allocated ?? 18;
  const annualUsed = balances?.ANNUAL?.used ?? 0;

  const sickAllocated = balances?.SICK?.allocated ?? 10;
  const sickUsed = balances?.SICK?.used ?? 0;

  const casualAllocated = balances?.CASUAL?.allocated ?? 10;
  const casualUsed = balances?.CASUAL?.used ?? 0;

  const cards = [
    {
      title: "Annual Balance",
      icon: Palmtree,
      colorClass: "bg-indigo-50 border-indigo-100 text-indigo-600",
      used: annualUsed,
      total: annualAllocated,
      description: "standard annual allotment",
    },
    {
      title: "Sick Balance",
      icon: HeartPulse,
      colorClass: "bg-rose-50 border-rose-100 text-rose-600",
      used: sickUsed,
      total: sickAllocated,
      description: "allocated medical coverage",
    },
    {
      title: "Casual Balance",
      icon: Coffee,
      colorClass: "bg-purple-50 border-purple-100 text-purple-600",
      used: casualUsed,
      total: casualAllocated,
      description: "casual exception leaves",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const remaining = Math.max(0, card.total - card.used);

        return (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900 block">
                {remaining}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  / {card.total} Days Left
                </span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">
                Used {card.used} days of {card.description}.
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}