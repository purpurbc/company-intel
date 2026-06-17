"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/src/components/ui/AppSidebar";
import { AppTopBar } from "@/src/components/ui/AppTopBar";
import { getUserProfile } from "@/src/lib/api";
import type { AppUserProfile } from "@/src/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUserProfile()
      .then((profile) => {
        if (!cancelled) setUserProfile(profile);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <AppSidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
      />
      <div
        className={[
          "min-h-screen transition-[padding]",
          sidebarOpen ? "md:pl-64" : "md:pl-14",
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
