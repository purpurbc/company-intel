"use client";

import { useState } from "react";
import { AppSidebar } from "@/src/components/ui/AppSidebar";
import { AppTopBar } from "@/src/components/ui/AppTopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <AppSidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />
      <div
        className={[
          "min-h-screen transition-[padding] duration-150 ease-out",
          sidebarOpen ? "md:pl-56" : "md:pl-12",
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
