import { ReactNode } from "react";
import Sidebar from "../../components/Slidebar"; // Matches the import path from your AdminLayout

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    // 1. Lock the height of the outer container on desktop to prevent the main window from scrolling
    <div className="min-h-screen bg-[#F8FAFC] lg:h-screen lg:overflow-hidden">
      <div className="lg:h-full lg:flex lg:gap-0">
        {/* Sidebar is fixed-position inside Slidebar */}
        <Sidebar role="employee" />

        {/* Main content uses remaining width; full-width responsive (no centered container) */}
        <main className="min-w-0 w-full p-6 lg:p-6 lg:h-screen lg:overflow-y-auto bg-[#F8FAFC] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* 24px padding + section spacing rules are applied at component level; this wrapper stays full-width */}

          {children}
        </main>
      </div>
    </div>
  );
}

