import { useEffect, useState } from "react";
import Header from "../components/shared/Header/Header.jsx";
import Sidebar from "../components/shared/Sidebar/Sidebar.jsx";
import Breadcrumbs from "../components/shared/Breadcrumbs/Breadcrumbs.jsx";
import { useBreadcrumbStore } from "../store/breadcrumbStore.js";
import { useUiStore } from "../store/uiStore.js";

export default function MainLayout({ children, hideHeaderInput = false, hideBreadcrumbs = false }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarExpanded = useUiStore((s) => s.sidebarExpanded);
  const consumeSidebarExpanded = useUiStore((s) => s.consumeSidebarExpanded);
  const breadcrumbItems = useBreadcrumbStore((s) => s.items);

  useEffect(() => {
    if (sidebarExpanded) {
      setSidebarCollapsed(false);
      consumeSidebarExpanded();
    }
  }, [sidebarExpanded, consumeSidebarExpanded]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--agro-page-bg)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          hideHeaderInput={hideHeaderInput}
        />
        <main className="flex-1 overflow-y-auto bg-[var(--agro-page-bg)]">
          <div className="w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            {!hideBreadcrumbs && breadcrumbItems?.length ? (
              <Breadcrumbs items={breadcrumbItems} />
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
