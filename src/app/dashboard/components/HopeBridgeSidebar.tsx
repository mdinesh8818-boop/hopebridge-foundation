"use client";

import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileBarChart,
  HandHeart,
  Handshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: ElementType };

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "FOUNDATION",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Mission & Vision", href: "/dashboard/mission-vision", icon: Target },
      { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { label: "Programs", href: "/dashboard/programs", icon: BarChart3 },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Donors", href: "/dashboard/donors", icon: CircleDollarSign },
      { label: "Volunteers", href: "/dashboard/volunteers", icon: Users },
      { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: HandHeart },
      { label: "Teams", href: "/dashboard/teams", icon: UserRound },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Impact Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: BrainCircuit },
      { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Organization", href: "/dashboard/organization", icon: Home },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help Center", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

type HopeBridgeSidebarProps = {
  activePath: string;
};

export default function HopeBridgeSidebar({ activePath }: HopeBridgeSidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="hb-brand-sub">FOUNDATION</div>
          <div className="hb-brand-tag">Foundation Intelligence</div>
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
              const Icon = item.icon;
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
            <small>Strategic assistant online</small>
          </span>
          <i />
        </button>

        <div className="hb-user-card">
          <div className="hb-user-avatar">DM</div>
          <div className="hb-user-copy">
            <strong>Dinesh M.</strong>
            <small>Administrator</small>
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
