"use client";

import { useState } from "react";
import { AppSidebar } from "@/src/components/ui/AppSidebar";
import { AppTopBar } from "@/src/components/ui/AppTopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={[
          "min-h-screen transition-[padding]",
          sidebarOpen ? "md:pl-64" : "",
        ].join(" ")}
      >
        <AppTopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
        />
        {children}
      </div>
    </>
  );
}
