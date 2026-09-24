"use client";

import { ActionControl } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

const ICONS = {
  logout: "/icons/menu/logout-svgrepo-com.svg",
  sidebarShow: "/icons/menu/show_sidebar.svg",
  sidebarHide: "/icons/menu/hide_sidebar.svg",
};

export function AppTopBar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/90 backdrop-blur">
      <div className="relative mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="md:hidden">
            <ActionControl
              label={sidebarOpen ? "Stäng sidomeny" : "Öppna sidomeny"}
              icon={
                <MaskedIcon
                  src={sidebarOpen ? ICONS.sidebarHide : ICONS.sidebarShow}
                />
              }
              onClick={onToggleSidebar}
              pressed={sidebarOpen}
              variant="ghost"
              size="icon"
            />
          </div>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Snabbmeny">
          <ActionControl 
            label="Logga ut" 
            icon={<MaskedIcon src={ICONS.logout} />}
            href="/"
            disabled
          />
        </nav>
      </div>
    </header>
  );
}
