import { ReactNode } from "react";
import Sidebar from "../../components/Slidebar"; // Matches the import path from your AdminLayout

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    // 1. Lock the outer container on desktop to prevent the main window from scrolling
    <div className="min-h-screen bg-surface-main lg:h-screen lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-full">
        {/* 2. Sidebar: Full height on desktop, sticky, and scrollable if content overflows */}
        <aside className="lg:h-screen lg:sticky lg:top-0 min-w-0 overflow-y-auto">
          {/* Explicitly passing role="employee" ensures the Employee Portal views are rendered */}
          <Sidebar role="employee" />
        </aside>

        {/* 3. Main Content: Only this section scrolls on desktop, with the scrollbars hidden */}
        <main className="min-w-0 p-4 lg:h-screen lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </div>
  );
}