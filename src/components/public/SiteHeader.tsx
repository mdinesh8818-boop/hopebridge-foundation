"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { PRIMARY_NAV, type PublicNavGroup } from "@/data/public-content";

function BrandMark() {
  return (
    <Link href="/" className="pub-focus-ring flex items-center gap-3 rounded-lg">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#efd786] bg-gradient-to-br from-[#fff1a3] to-[#c28a17] text-sm font-black text-[#073b2f]">
        H
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-wide text-[#18392e]">HopeBridge</span>
        <span className="block text-[11px] text-[#65766e]">Foundation</span>
      </span>
    </Link>
  );
}

function MegaMenu({
  group,
  open,
  onOpen,
  onClose,
}: {
  group: PublicNavGroup;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const panelId = useId();

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
    >
      <button
        type="button"
        className="pub-nav-link pub-focus-ring inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {group.label}
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          id={panelId}
          className="pub-mega absolute left-0 top-full z-50 mt-2 w-[340px] rounded-2xl p-3"
          role="menu"
        >
          <Link
            href={group.href}
            className="pub-focus-ring mb-2 block rounded-xl px-3 py-2 text-sm font-semibold text-[#0d5f44] hover:bg-[#f4f7f4]"
            onClick={onClose}
          >
            Explore {group.label}
          </Link>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  role="menuitem"
                  className="pub-focus-ring block rounded-xl px-3 py-2 hover:bg-[#f4f7f4]"
                  onClick={onClose}
                >
                  <span className="block text-sm font-medium text-[#18392e]">{item.label}</span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs text-[#65766e]">{item.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setMobileSection(null);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-[#e8decb] bg-[#fffdf6]/95 backdrop-blur-md"
    >
      <div className="pub-container-wide flex items-center justify-between gap-4 py-3.5">
        <BrandMark />

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {PRIMARY_NAV.map((group) =>
            group.items.length > 1 ? (
              <MegaMenu
                key={group.id}
                group={group}
                open={openGroup === group.id}
                onOpen={() => setOpenGroup(group.id)}
                onClose={() => setOpenGroup((current) => (current === group.id ? null : current))}
              />
            ) : (
              <Link
                key={group.id}
                href={group.href}
                className="pub-nav-link pub-focus-ring rounded-md px-2 py-2 text-sm font-medium"
                aria-current={pathname === group.href ? "page" : undefined}
              >
                {group.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="pub-focus-ring hidden rounded-xl border border-[#e4dac6] bg-white px-4 py-2 text-sm font-medium text-[#2d493e] sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/donate"
            className="hb-gold-btn pub-focus-ring inline-flex rounded-xl px-4 py-2 text-sm font-bold"
          >
            Donate
          </Link>
          <button
            type="button"
            className="pub-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-white text-[#0d5f44] xl:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#e8decb] bg-[#fffdf6] xl:hidden">
          <nav className="pub-container space-y-1 py-4" aria-label="Mobile">
            {PRIMARY_NAV.map((group) => {
              const expanded = mobileSection === group.id;
              return (
                <div key={group.id} className="border-b border-[#efe7d8] py-2">
                  <button
                    type="button"
                    className="pub-focus-ring flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#18392e]"
                    aria-expanded={expanded}
                    onClick={() =>
                      setMobileSection((current) => (current === group.id ? null : group.id))
                    }
                  >
                    {group.label}
                    <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
                  </button>
                  {expanded ? (
                    <ul className="mt-1 space-y-1 pb-2 pl-2">
                      <li>
                        <Link
                          href={group.href}
                          className="pub-focus-ring block rounded-lg px-2 py-2 text-sm text-[#0d5f44]"
                        >
                          Overview
                        </Link>
                      </li>
                      {group.items.map((item) => (
                        <li key={item.href + item.label}>
                          <Link
                            href={item.href}
                            className="pub-focus-ring block rounded-lg px-2 py-2 text-sm text-[#3f564c]"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
            <div className="flex gap-2 pt-3">
              <Link
                href="/auth/login"
                className="pub-focus-ring flex-1 rounded-xl border border-[#e4dac6] bg-white px-4 py-3 text-center text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/get-involved"
                className="hb-emerald-btn pub-focus-ring flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold"
              >
                Get Involved
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
