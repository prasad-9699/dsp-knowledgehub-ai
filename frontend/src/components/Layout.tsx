import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import KnowledgeLibraryModal from './KnowledgeLibraryModal';

export default function Layout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="enterprise-layout-root">
      {/* ─── DESKTOP COLLAPSIBLE SIDEBAR ──────────────────────────── */}
      <AppSidebar
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />

      {/* ─── MOBILE SLIDE-OUT DRAWER ──────────────────────────────── */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      <div className={`mobile-drawer-container ${mobileDrawerOpen ? 'is-open' : ''}`}>
        <AppSidebar
          isMobileDrawer={true}
          onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
        />
      </div>

      {/* ─── WORKSPACE VIEWPORT ───────────────────────────────────── */}
      <div className="enterprise-main-viewport">
        <AppHeader
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
        />

        <main className="enterprise-page-area">
          <Outlet />
        </main>
      </div>

      {/* ─── KNOWLEDGE LIBRARY MODAL ──────────────────────────────── */}
      {isLibraryOpen && (
        <KnowledgeLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}
    </div>
  );
}
