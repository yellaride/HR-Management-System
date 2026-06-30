import type { ReactNode } from "react";
import AdminSidebar from "../../components/Slidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // 1. Lock the height of the outer container on desktop to prevent the main window from scrolling
    <div className="min-h-screen bg-surface-main lg:h-screen lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-full">
        {/* 2. Sidebar: Full height on desktop, sticky, and scrollable only if its own content overflows */}
        <aside className="lg:h-screen lg:sticky lg:top-0 min-w-0 overflow-y-auto">
          <AdminSidebar />
        </aside>

        {/* 3. Main Content: Only this side scrolls, and the scrollbar is hidden */}
        <main className="min-w-0 p-4 lg:h-screen lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </div>
  );
}