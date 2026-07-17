import React, { useMemo } from "react";
import { EmployeeBirthday } from "@/lib/types";

interface CalendarViewProps {
  employees: EmployeeBirthday[];
  currentDayNum: number;
  currentMonthIdx: number;
  selectedMonthIdx: number;
  onSelectEmployee: (emp: EmployeeBirthday) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  employees,
  currentDayNum,
  currentMonthIdx,
  selectedMonthIdx,
  onSelectEmployee,
}) => {
  const monthLabels = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Dynamically calculate empty cell offsets for the selected month in the calendar year
  const calendarCells = useMemo(() => {
    const year = 2026;
    const daysInMonth = new Date(year, selectedMonthIdx + 1, 0).getDate();
    const startOffset = new Date(year, selectedMonthIdx, 1).getDay(); // Sunday=0, Monday=1 etc.
    
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [selectedMonthIdx]);

  return (
    <div className="panel overflow-hidden bg-surface-card border-line-subtle rounded-2xl shadow-sm">
      {/* Header */}
      <div className="panel-header panel-section flex items-center justify-between border-b border-line-subtle bg-surface-main/30 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent"></span>
          </span>
          <h3 className="panel-header-title text-sm font-extrabold tracking-wide text-content-main uppercase">
            {monthLabels[selectedMonthIdx]} 2026
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-subtle text-brand-accent border border-brand-accent/15 uppercase tracking-wide">
          🎉 {employees.length} {employees.length === 1 ? "Birthday" : "Birthdays"}
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center py-3 bg-surface-main/50 border-b border-line-subtle">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-surface-main/20 rounded-xl min-h-[80px] md:min-h-[100px] border border-dashed border-line-subtle/30"
                />
              );
            }

            const dayMatches = employees.filter(
              (emp) => emp.birthMonth === selectedMonthIdx && emp.birthDay === day
            );
            const isToday = day === currentDayNum && selectedMonthIdx === currentMonthIdx;
            const hasBirthdays = dayMatches.length > 0;

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  if (hasBirthdays) {
                    onSelectEmployee(dayMatches[0]);
                  }
                }}
                className={`group border rounded-xl p-3 min-h-[80px] md:min-h-[100px] flex flex-col justify-between transition-all duration-300 relative ${
                  isToday
                    ? "bg-brand-subtle/30 border-brand-accent ring-2 ring-brand-accent/10 shadow-xs"
                    : "bg-surface-card border-line-subtle hover:border-line-subtle/80"
                } ${
                  hasBirthdays
                    ? "cursor-pointer hover:border-brand-accent/50 hover:shadow-md hover:-translate-y-0.5"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-bold leading-none transition-colors duration-200 ${
                      isToday
                        ? "text-brand-accent font-black text-sm"
                        : "text-content-secondary group-hover:text-content-main"
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-black tracking-wider uppercase text-brand-accent px-1.5 py-0.5 rounded-md bg-brand-subtle/50 leading-none">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-3 w-full z-10">
                  {dayMatches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-brand-subtle border border-brand-accent/10 hover:border-brand-accent/25 text-brand-accent text-[9px] px-2 py-1 rounded-md font-bold truncate leading-none text-left flex items-center gap-1 transition-all duration-200"
                      title={`${m.name} - ${m.designation}`}
                    >
                      <span className="shrink-0 text-[10px]">🎂</span>
                      <span className="truncate">{m.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-line-subtle bg-surface-main/30 px-6 py-4 flex flex-wrap gap-4 items-center justify-between text-xs text-content-secondary">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-brand-subtle/50 border border-brand-accent/30 inline-block" />
            <span className="text-[11px] font-medium text-content-secondary">Current Date</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-brand-subtle border border-brand-accent/10 flex items-center justify-center text-[8px] text-brand-accent font-bold">🎂</span>
            <span className="text-[11px] font-medium text-content-secondary">Birthday Record</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
          Calendar View
        </span>
      </div>
    </div>
  );
};