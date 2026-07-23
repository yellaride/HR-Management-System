import type { ReactNode } from "react";
import Sidebar, { SidebarProvider } from "../../components/Slidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface-main flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
        <Sidebar role="admin" />

        <main className="min-w-0 w-full flex-1 p-4 sm:p-6 lg:p-8 lg:h-screen lg:overflow-y-auto bg-surface-main [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}