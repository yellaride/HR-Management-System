"use client";

import React from "react";
import { Calendar, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface LeaveRecord {
  id: string;
  type: string;
  typeUpper?: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  statusUpper?: string;
}

interface LeaveHistoryTableProps {
  history: LeaveRecord[];
}

const statusStyles: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
};

const typeStyles: Record<string, string> = {
  ANNUAL: "bg-indigo-50 text-indigo-700 border-indigo-100",
  SICK: "bg-rose-50 text-rose-700 border-rose-100",
  CASUAL: "bg-purple-50 text-purple-700 border-purple-100",
};

export default function LeaveHistoryTable({ history }: LeaveHistoryTableProps) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
        Your Request History
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No leave requests requested yet.
          </div>
        ) : (
          <div className="overflow-x-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Requested Dates</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 max-w-sm">Reason for Leave</th>
                  <th className="px-6 py-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 text-xs">
                {history.map((record) => {
                  // Normalize casing properties dynamically
                  const nType = String(record.typeUpper || record.type || "ANNUAL").toUpperCase();
                  const nStatus = String(record.statusUpper || record.status || "PENDING").toUpperCase();

                  const displayType =
                    nType.includes("ANNUAL")
                      ? "Annual Leave"
                      : nType.includes("SICK")
                        ? "Sick Leave"
                        : nType.includes("CASUAL")
                          ? "Casual Leave"
                          : record.type;


                  return (
                    <tr key={record.id} className="hover:bg-gray-50/30 transition">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide ${
                            typeStyles[nType] || "bg-slate-50 text-slate-700 border-slate-100"
                          }`}
                        >
                          {displayType}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {record.startDate} to {record.endDate}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-900">
                        {record.days} {record.days === 1 ? "Day" : "Days"}
                      </td>

                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-start gap-1.5 leading-normal">
                          <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <span className="truncate block text-gray-500" title={record.reason}>
                            {record.reason}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              statusStyles[nStatus] || "bg-slate-50 text-slate-700 border-slate-100"
                            }`}
                          >
                            {nStatus === "APPROVED" && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            )}
                            {nStatus === "REJECTED" && (
                              <XCircle className="w-3 h-3 text-rose-500" />
                            )}
                            {nStatus === "PENDING" && (
                              <Clock className="w-3 h-3 text-amber-500" />
                            )}
                            {nStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}