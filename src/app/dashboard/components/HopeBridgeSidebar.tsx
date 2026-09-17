"use client";

import type { ElementType } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganizationOptional } from "@/providers/OrganizationProvider";
import { OrganizationLabel } from "@/components/OrganizationLabel";
import { HOPEBRIDGE_ORGANIZATION_ID } from "@/lib/organization";
import {
  BrainCircuit,
  ChevronRight,
  Handshake,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  buildHopeBridgeNavGroups,
  type HopeBridgeNavGroup,
} from "./hopeBridgeNav";

type HopeBridgeSidebarProps = {
  activePath: string;
};

export default function HopeBridgeSidebar({ activePath }: HopeBridgeSidebarProps) {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const organization = useOrganizationOptional();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups: HopeBridgeNavGroup[] = useMemo(
    () => buildHopeBridgeNavGroups(profile),
    [profile],
  );

  const workspaceName =
    organization?.displayName ||
    profile?.organizationId ||
    "Organization workspace";
  const productSub =
    (organization?.organizationId || profile?.organizationId) ===
    HOPEBRIDGE_ORGANIZATION_ID
      ? "FOUNDATION"
      : "WORKSPACE";

  const displayName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "HopeBridge user");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "HB";

  function navigate(href: string) {
    setMobileOpen(false);
    router.push(href);
  }

  async function handleSignOut() {
    setMobileOpen(false);
    await logout();
    router.push("/auth/login");
  }

  const sidebarInner = (
    <>
      <div className="hb-brand">
        <div className="hb-logo">
          <Handshake size={28} strokeWidth={1.8} />
          <span className="hb-logo-shine" />
        </div>
        <div>
          <div className="hb-brand-name">HOPEBRIDGE</div>
          <div className="hb-brand-sub">{productSub}</div>
          <div className="hb-brand-tag" title={workspaceName}>
            <OrganizationLabel fallback={workspaceName} />
          </div>
        </div>
        <button
          className="hb-mobile-close"
          onClick={() => setMobileOpen(false)}
          type="button"
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>

      <div className="hb-side-divider" />

      <div className="hb-nav-scroll">
        {navGroups.map((group) => (
          <div className="hb-nav-group" key={group.title}>
            <div className="hb-nav-title">{group.title}</div>
            {group.items.map((item) => {
              const Icon = item.icon as ElementType;
              const isActive = activePath === item.href;
              return (
                <button
                  key={item.href}
                  type="button"
                  className={isActive ? "hb-nav-item hb-nav-item-active" : "hb-nav-item"}
                  onClick={() => navigate(item.href)}
                >
                  <span className={isActive ? "hb-nav-icon hb-nav-icon-active" : "hb-nav-icon"}>
                    <Icon size={16} />
                  </span>
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="hb-active-spark" />
                  ) : (
                    <ChevronRight size={14} className="hb-nav-arrow" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hb-side-bottom">
        <button type="button" className="hb-ai-side" onClick={() => navigate("/dashboard/ai-assistant")}>
          <span className="hb-ai-side-icon">
            <BrainCircuit size={22} />
          </span>
          <span>
            <strong>HopeBridge AI</strong>
            <small>Grounded insights available</small>
          </span>
          <i />
        </button>

        <div className="hb-user-card">
          <div className="hb-user-avatar">{initials}</div>
          <div className="hb-user-copy">
            <strong>{displayName}</strong>
            <small>{user?.email ?? "Signed in"}</small>
          </div>
          <button
            type="button"
            className="hb-user-logout"
            aria-label="Sign out"
            onClick={handleSignOut}
          >
            <LogOut size={15} />
          </button>
        </div>

        <div className="hb-motto">Together We Create Impact</div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="hb-mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <aside className="hb-sidebar desktop">{sidebarInner}</aside>

      {mobileOpen && (
        <div className="hb-mobile-layer">
          <button
            className="hb-mobile-overlay"
            onClick={() => setMobileOpen(false)}
            type="button"
            aria-label="Close menu overlay"
          />
          <aside className="hb-sidebar mobile">{sidebarInner}</aside>
        </div>
      )}
    </>
  );
}
