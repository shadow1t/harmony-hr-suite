import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { TopBar } from "./TopBar";

export function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EmployeeSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
